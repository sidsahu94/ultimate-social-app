// backend/controllers/chatController.js
const Chat = require('../models/Chat');
const User = require('../models/User'); // 🔥 Imported User model
const path = require('path');
const fs = require('fs');
const cloudinaryUtil = require('../utils/cloudinary');

const safeUploadToCloudinary = async (filePath) => {
  try {
    const res = await cloudinaryUtil.uploads(filePath, 'ultimate_social/chat');
    return { url: res.secure_url };
  } catch (err) {
    const localUrl = `/uploads/${path.basename(filePath)}`;
    return { url: localUrl };
  }
};
// Create chat (group or 1-to-1)
exports.createChat = async (req, res) => {
  try {
    const { participants = [], name = '', isGroup = false } = req.body;
    
    // Normalize participants (add self)
    const unique = new Set(participants.map(String));
    unique.add(req.user._id.toString());
    const memberIds = Array.from(unique);

    if (memberIds.length < 2) return res.status(400).json({ message: "Need at least 2 users" });

    // 🔥 FIX: Check for existing 1-on-1 chat
    if (!isGroup && memberIds.length === 2) {
        // Find chat with EXACTLY these 2 members and isGroup: false
        const existing = await Chat.findOne({
            isGroup: false,
            participants: { $all: memberIds, $size: 2 }
        }).populate('participants','name avatar badgeVerified');

        if (existing) {
            return res.status(200).json(existing);
        }
    }

    const chat = new Chat({ participants: memberIds, name, isGroup });
    await chat.save();
    
    const populated = await Chat.findById(chat._id).populate('participants','name avatar badgeVerified');
    
    // Notify recipients via socket
    const io = req.app.get('io');
    if (io) {
        memberIds.forEach(id => {
            if (id !== req.user._id.toString()) {
                io.to(id).emit('chat:created', populated);
            }
        });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('createChat err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants','name avatar badgeVerified')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error('getChats err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', media = null } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const senderId = req.user._id.toString();

    // Ensure in participants
    if (!chat.participants.map(String).includes(senderId)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // 🔥 FIX: Enforce Blocking Logic
    // Get recipients (everyone in chat except me)
    const recipientIds = chat.participants.map(String).filter(id => id !== senderId);
    
    // Fetch users to verify blocked lists
    const [sender, ...recipients] = await Promise.all([
        User.findById(senderId).select('blockedUsers'),
        ...recipientIds.map(id => User.findById(id).select('blockedUsers'))
    ]);

    // Check bidirectional blocking
    const isBlocked = recipients.some(r => 
        sender.blockedUsers.includes(r._id) || r.blockedUsers.includes(senderId)
    );

    if (isBlocked) {
        return res.status(403).json({ message: 'Message failed: You have been blocked or have blocked this user.' });
    }

    const message = {
      sender: req.user._id,
      content: content,
      media: media,
      createdAt: Date.now()
    };

    chat.messages.push(message);
    chat.updatedAt = Date.now();

    // unread counters for others
    for (const u of chat.participants.map(String)) {
      if (u !== senderId) {
        const prev = Number(chat.unread.get(u) || 0);
        chat.unread.set(u, prev + 1);
      }
    }

    await chat.save();

    const populated = await Chat.findById(chatId)
      .populate('participants','name avatar')
      .populate('messages.sender','name avatar');

    res.status(201).json(populated);
  } catch (err) {
    console.error('sendMessage err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getChatById = async (req, res) => {
  try {
    // Limit to last 50 messages for performance
    const chat = await Chat.findById(req.params.chatId || req.params.id, {
        participants: 1,
        name: 1,
        isGroup: 1,
        unread: 1,
        messages: { $slice: -50 } 
    })
      .populate('participants','name avatar')
      .populate('messages.sender','name avatar');

    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const uid = req.user._id.toString();
    if (!chat.participants.map(p => p._id.toString()).includes(uid) && req.user.role !== 'admin') {
      return res.status(403).json({ message:'Not allowed' });
    }

    // mark unread zero for me
    chat.unread.set(uid, 0);
    await chat.save();

    res.json(chat);
  } catch (err) {
    console.error('getChatById err', err);
    res.status(500).json({ message:'Server error', error: err.message });
  }
};

// React to a message
exports.reactMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const msg = chat.messages.id(messageId);
    if (!msg) return res.status(404).json({ message:'Message not found' });

    // toggle reaction from me with this emoji
    const mine = (msg.reactions || []).find(r => r.by?.toString() === req.user._id.toString());
    if (mine && mine.emoji === emoji) {
      msg.reactions = msg.reactions.filter(r => r.by.toString() !== req.user._id.toString());
    } else {
      msg.reactions = (msg.reactions || []).filter(r => r.by.toString() !== req.user._id.toString());
      msg.reactions.push({ by: req.user._id, emoji });
    }

    await chat.save();

    const populated = await Chat.findById(chatId).populate('messages.sender','name avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message:'Server error' });
  }
};

// Mark message(s) read
exports.markRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const uid = req.user._id.toString();

    for (const m of chat.messages) {
      if (!m.seenBy.map(String).includes(uid)) m.seenBy.push(req.user._id);
    }
    chat.unread.set(uid, 0);
    await chat.save();
    res.json({ success:true });
  } catch (err) {
    res.status(500).json({ message:'Server error' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOneAndDelete({
      _id: chatId,
      participants: req.user._id // Security: Ensure requester is a participant
    });
    
    if (!chat) return res.status(404).json({ message: "Chat not found or unauthorized" });
    
    res.json({ message: "Chat deleted", chatId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.leaveChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.participants = chat.participants.filter(p => String(p) !== String(req.user._id));
    
    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chat._id);
      return res.json({ message: 'Chat deleted (empty)' });
    }

    chat.messages.push({
        sender: req.user._id,
        content: `${req.user.name} left the group.`,
        isSystem: true 
    });
    await chat.save();

    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
};

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
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ 
        participants: userId,
        [`unread.${userId}`]: { $gt: 0 } 
    });
    
    let total = 0;
    chats.forEach(c => {
        total += (c.unread.get(String(userId)) || 0);
    });
    
    res.json({ count: total });
  } catch (err) {
    res.status(500).json({ count: 0 });
  }
};
exports.unsendMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Find the message
    const msg = chat.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // Verify Ownership
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Remove it
    // Note: In Mongoose subdocs, .remove() is deprecated in newer versions, use pull
    chat.messages.pull(messageId);
    await chat.save();

    // 🔥 Real-time Update
    const io = req.app.get('io') || global.io;
    
    // Notify all participants
    chat.participants.forEach(pId => {
        const sock = global.userSockets?.get(String(pId)); // Assuming you export userSockets or manage via room
        // Easier way: Broadcast to the chat room we created in connection logic
        // But since we used 'joinRoom(userId)', we can just emit to user IDs
        if(sock) io.to(sock).emit('message:deleted', { chatId, messageId });
        
        // OR if you joined a room for the chat:
        // io.to(chatId).emit('message:deleted', { chatId, messageId });
    });

    // We can also emit to the specific chat ID room if your frontend joins it
    io.emit('message:deleted', { chatId, messageId }); // Broadest fallback

    res.json({ message: 'Message unsent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};