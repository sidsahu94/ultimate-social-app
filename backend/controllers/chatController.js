// backend/controllers/chatController.js
const Chat = require('../models/Chat');
const User = require('../models/User');

// --- CREATE CHAT ---
exports.createChat = async (req, res) => {
  try {
    const { participants = [], name = '', isGroup = false } = req.body;
    
    // Safety check for participants
    if (!Array.isArray(participants)) return res.status(400).json({ message: "Invalid participants data" });

    // Normalize participants (add self)
    const unique = new Set(participants.map(String));
    unique.add(req.user._id.toString());
    const memberIds = Array.from(unique);

    if (memberIds.length < 2) return res.status(400).json({ message: "Need at least 2 users" });

    // 🔥 FIX: Standard check-then-create logic (Fixes MongoDB 500 Plan Executor Error)
    if (!isGroup && memberIds.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: memberIds, $size: 2 }
      }).populate('participants', 'name avatar isVerified');

      if (existingChat) {
        return res.status(200).json(existingChat);
      }
    }

    // Create new chat
    const chat = await Chat.create({ 
        participants: memberIds, 
        name: isGroup ? name : '', 
        isGroup 
    });
    
    const populated = await Chat.findById(chat._id).populate('participants','name avatar isVerified');
    
    // Notify recipients via socket
    const io = req.app.get('io');
    if (io) {
        memberIds.forEach(id => {
            if (id !== req.user._id.toString()) io.to(id).emit('chat:created', populated);
        });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('createChat err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET ALL CHATS ---
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants','name avatar isVerified')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- SEND MESSAGE ---
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', media = null, replyTo = null, isForwarded = false } = req.body;
    
    // Validate ID format
    if(!chatId.match(/^[0-9a-fA-F]{24}$/)) return res.status(404).json({ message: 'Invalid Chat ID' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const senderId = req.user._id.toString();

    // Check Membership
    if (!chat.participants.map(String).includes(senderId)) {
        return res.status(403).json({ message: 'Not allowed' });
    }

    const message = {
      sender: req.user._id,
      content,
      media,
      replyTo,
      isForwarded,
      createdAt: Date.now()
    };

    chat.messages.push(message);
    
    // 🔥 CAP HISTORY: Keep document size manageable (Max 1000 msgs)
    if (chat.messages.length > 1000) chat.messages = chat.messages.slice(-500); 
    chat.updatedAt = Date.now();

    // Increment Unread
    for (const u of chat.participants.map(String)) {
      if (u !== senderId) {
        chat.unread.set(u, (chat.unread.get(u) || 0) + 1);
      }
    }

    await chat.save();

    // Populate for Socket
    const populated = await Chat.findById(chatId)
      .populate('participants','name avatar')
      .populate('messages.sender','name avatar')
      .populate({
          path: 'messages.replyTo',
          select: 'content sender',
          populate: { path: 'sender', select: 'name' }
      });

    const newMessage = populated.messages[populated.messages.length - 1];

    const io = req.app.get('io');
    if (io) {
        io.to(chatId).emit('receiveMessage', { chatId, message: newMessage });
        // Emit "Delivered" event
        io.to(chatId).emit('message:delivered', { 
            chatId, 
            messageId: newMessage._id,
            userId: senderId 
        });
    }

    res.json(newMessage);
  } catch (err) {
    console.error("SendMessage Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET SINGLE CHAT ---
exports.getChatById = async (req, res) => {
  try {
    const chatId = req.params.chatId || req.params.id;
    if(!chatId.match(/^[0-9a-fA-F]{24}$/)) return res.status(404).json({ message: 'Invalid ID' });

    // Fetch Chat with limited messages using slice
    const chat = await Chat.findById(chatId, {
        messages: { $slice: -50 } // Get last 50 messages
    })
    .populate('participants', 'name avatar isVerified')
    .populate('messages.sender', 'name avatar')
    // Safe populate for replies
    .populate({
        path: 'messages.replyTo',
        select: 'content sender',
        populate: { path: 'sender', select: 'name' }
    });

    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const uid = req.user._id.toString();
    const isParticipant = chat.participants.some(p => p._id.toString() === uid);

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message:'Not allowed' });
    }

    // Reset unread count for current user
    if (chat.unread) {
        chat.unread.set(uid, 0);
        await chat.save();
    }

    res.json(chat);
  } catch (err) {
    console.error('getChatById error:', err);
    res.status(500).json({ message:'Server error' });
  }
};

// --- DELETE CHAT ---
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    
    // Allow deleting if user is a participant OR admin
    if (!chat.participants.map(String).includes(req.user._id.toString()) && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    await Chat.findByIdAndDelete(chatId);
    
    const io = req.app.get('io');
    if(io) io.to(chatId).emit('chat:deleted', { chatId });

    res.json({ message: "Chat deleted" });
  } catch (err) { 
      console.error("Delete Chat Error:", err);
      res.status(500).json({ message: "Server error" }); 
  }
};

// --- LEAVE GROUP ---
exports.leaveChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.participants = chat.participants.filter(p => String(p) !== String(req.user._id));
    
    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chat._id);
    } else {
      chat.messages.push({ 
          sender: req.user._id, 
          content: `${req.user.name} left.`, 
          isSystem: true 
      });
      await chat.save();
    }
    res.json({ message: 'Left group' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

// --- EDIT MESSAGE ---
exports.editMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { newContent } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const msg = chat.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    if (String(msg.sender) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });

    // Check 60 Minute Window
    const timeDiff = Date.now() - new Date(msg.createdAt).getTime();
    if (timeDiff > 60 * 60 * 1000) {
        return res.status(400).json({ message: 'Edit time expired (1 hour limit)' });
    }

    msg.content = newContent;
    msg.editedAt = Date.now();
    await chat.save();

    const io = req.app.get('io');
    if(io) io.to(chatId).emit('message:updated', { chatId, messageId, newContent, editedAt: msg.editedAt });

    res.json({ message: 'Message updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// --- PIN MESSAGE ---
exports.togglePinMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const isPinned = chat.pinnedMessages.includes(messageId);
        if (isPinned) chat.pinnedMessages = chat.pinnedMessages.filter(id => String(id) !== messageId);
        else chat.pinnedMessages.push(messageId);

        await chat.save();
        
        const io = req.app.get('io');
        if(io) io.to(chatId).emit('chat:pinned', { pinnedMessages: chat.pinnedMessages });

        res.json({ pinnedMessages: chat.pinnedMessages });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// --- SEARCH CHAT ---
exports.searchChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query; 
    const chat = await Chat.findById(chatId).select('messages');
    
    // In-Memory Filter (Okay for capped arrays)
    const results = (chat.messages || []).filter(m => m.content && m.content.toLowerCase().includes(q.toLowerCase()));
    res.json(results);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// --- PAGINATION ---
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { before } = req.query; 
    const chat = await Chat.findById(chatId).select('messages').populate('messages.sender', 'name avatar');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const beforeDate = new Date(before);
    const sorted = chat.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
    const olderMessages = sorted.filter(m => new Date(m.createdAt) < beforeDate).slice(0, 20); 
    
    res.json(olderMessages.reverse()); 
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// --- UTILS ---
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ participants: userId, [`unread.${userId}`]: { $gt: 0 } });
    let total = 0;
    chats.forEach(c => { total += (c.unread.get(String(userId)) || 0); });
    res.json({ count: total });
  } catch (err) { res.status(500).json({ count: 0 }); }
};

exports.unsendMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const msg = chat.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not allowed' });

    chat.messages.pull(messageId);
    await chat.save();

    const io = req.app.get('io');
    if(io) io.to(chatId).emit('message:deleted', { chatId, messageId });

    res.json({ message: 'Message unsent' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.reactMessage = async (req, res) => res.json({}); 

exports.markRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId);
        const uid = req.user._id.toString();
        chat.unread.set(uid, 0);
        await chat.save();
        res.json({ success: true });
    } catch(e) { res.json({ success: false }); }
};