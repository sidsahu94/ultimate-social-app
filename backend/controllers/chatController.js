// backend/controllers/chatController.js
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const createNotification = require('../utils/notify');
const mongoose = require('mongoose');

// --- Helper: Check Block Status ---
const checkBlocked = async (userId, targetIds) => {
    const user = await User.findById(userId).select('blockedUsers');
    const targets = await User.find({ _id: { $in: targetIds } }).select('blockedUsers');
    
    for (const target of targets) {
        if (user.blockedUsers.includes(target._id)) return true; // I blocked them
        if (target.blockedUsers.includes(userId)) return true; // They blocked me
    }
    return false;
};

// --- 1. CREATE CHAT ---
exports.createChat = async (req, res) => {
    try {
        const { participants = [], name = '', isGroup = false } = req.body;
        // Ensure unique participants and include self
        const memberIds = [...new Set([...participants, req.user._id.toString()])];

        if (memberIds.length < 2) return res.status(400).json({ message: "Need at least 2 members" });

        // Security: Check Block Status
        const otherMembers = memberIds.filter(id => id !== req.user._id.toString());
        if (await checkBlocked(req.user._id, otherMembers)) {
            return res.status(403).json({ message: "You cannot chat with this user (Blocked)." });
        }

        // Check if 1:1 chat exists
        if (!isGroup && memberIds.length === 2) {
            const existing = await Chat.findOne({ 
                isGroup: false, 
                participants: { $all: memberIds, $size: 2 } 
            })
            .populate('participants', 'name avatar')
            .populate('lastMessage');
            
            if (existing) return res.json(existing);
        }

        const chat = await Chat.create({ 
            participants: memberIds, 
            name: isGroup ? name : '', 
            isGroup,
            admins: isGroup ? [req.user._id] : [],
            unread: {} // Initialize unread map
        });
        
        const populated = await Chat.findById(chat._id)
            .populate('participants', 'name avatar');
        
        // Notify participants via socket & DB
        const io = req.app.get('io');
        if(io) {
            memberIds.forEach(async (id) => {
                if(id !== req.user._id.toString()) {
                    io.to(id).emit('chat:created', populated);
                    
                    if (isGroup) {
                        await createNotification(req, {
                            toUser: id,
                            type: 'system', 
                            data: { chatId: chat._id, link: `/chat/${chat._id}` },
                            message: `${req.user.name} added you to a new group: "${chat.name || 'Group'}"`
                        });
                    }
                }
            });
        }

        res.status(201).json(populated);
    } catch(e) { 
        console.error(e);
        res.status(500).json({ message:'Error creating chat' }); 
    }
};

// --- 2. GET ALL CHATS ---
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name avatar isVerified userStatus')
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt isForwarded media audio type',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error("getChats Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 3. GET SINGLE CHAT ---
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name avatar isVerified userStatus')
      .lean(); 

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Security Check
    const isParticipant = chat.participants.some(p => p._id.toString() === req.user._id.toString());
    if (!isParticipant && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not allowed' });
    }

    // Fetch Messages
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name avatar')
      .populate({
          path: 'replyTo',
          select: 'content sender isEncrypted',
          populate: { path: 'sender', select: 'name' }
      });

    chat.messages = messages.reverse(); 

    res.json(chat);
  } catch (err) {
    console.error('getChatById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 4. SEND MESSAGE ---
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', media = null, audio = null, replyTo = null, isForwarded = false, isEncrypted = false } = req.body;
    const senderId = req.user._id.toString();

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Check if blocked (1:1 only)
    if (!chat.isGroup) {
        const otherId = chat.participants.find(p => p.toString() !== senderId);
        if (otherId) {
            const target = await User.findById(otherId).select('blockedUsers');
            if (target.blockedUsers.includes(senderId)) {
                return res.status(403).json({ message: "Message not delivered (User blocked you)" });
            }
        }
    }

    // Verify Membership
    if (!chat.participants.map(String).includes(senderId)) {
        return res.status(403).json({ message: 'Not allowed' });
    }

    // Create Message
    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      media,
      audio,
      replyTo,
      isForwarded,
      isEncrypted
    });

    // Update Chat Metadata (Last Message & Timestamp)
    // Atomic update for Unread Count to prevent Race Conditions
    const updateOps = {
        $set: { 
            lastMessage: message._id,
            updatedAt: Date.now()
        },
        $inc: {}
    };

    // Increment unread for all other participants
    chat.participants.forEach(p => {
        const pid = p.toString();
        if (pid !== senderId) {
            updateOps.$inc[`unread.${pid}`] = 1;
        }
    });

    await Chat.findByIdAndUpdate(chatId, updateOps);

    const populatedMsg = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate({
          path: 'replyTo',
          select: 'content sender isEncrypted',
          populate: { path: 'sender', select: 'name' }
      });

    // Emit Socket
    const io = req.app.get('io');
    if (io) {
        chat.participants.forEach(p => {
            // Send to user's personal room
            io.to(p.toString()).emit('receiveMessage', { 
                chatId, 
                message: populatedMsg 
            });
        });
    }

    res.json(populatedMsg);
  } catch (err) {
    console.error("SendMessage Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 5. MARK READ (Blue Ticks) ---
exports.markRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id.toString();

        // 1. Reset unread count in Chat Model
        await Chat.updateOne(
            { _id: chatId },
            { $set: { [`unread.${userId}`]: 0 } }
        );
        
        // 2. 🔥 FIX: Update Messages 'readBy' array for Blue Ticks
        await Message.updateMany(
            { chat: chatId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );
        
        // 3. Emit Real-time Event
        const io = req.app.get('io');
        if (io) {
            // Clear notification badge for the reader
            io.to(userId).emit('chat:read', { chatId }); 
            
            // Notify others in the chat room that this user has read messages
            io.to(chatId).emit('message:read', { 
                chatId, 
                userId, 
                readAt: new Date() 
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("MarkRead Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- 6. PAGINATION ---
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { before } = req.query; 
    
    const chat = await Chat.findById(chatId).select('participants');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.map(String).includes(req.user._id.toString())) {
        return res.status(403).json({ message: 'Not allowed' });
    }

    const query = { chat: chatId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'name avatar')
      .populate('replyTo', 'content sender isEncrypted');

    res.json(messages.reverse()); 
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 7. UTILITIES & GROUP MANAGEMENT ---

exports.updateGroupMember = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, action } = req.body; // 'kick' | 'promote' | 'demote'
    
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!chat.admins.includes(req.user._id)) return res.status(403).json({ message: 'Admin privileges required' });

    if (action === 'kick') {
        chat.participants = chat.participants.filter(p => p.toString() !== userId);
        chat.admins = chat.admins.filter(a => a.toString() !== userId);
        await Message.create({ chat: chatId, sender: req.user._id, content: `removed a member.`, isSystem: true });
    } 
    else if (action === 'promote') {
        if (!chat.admins.includes(userId)) chat.admins.push(userId);
    }
    else if (action === 'demote') {
        chat.admins = chat.admins.filter(a => a.toString() !== userId);
    }

    await chat.save();
    
    const io = req.app.get('io');
    if(io) io.to(chatId).emit('chat:updated', chat); 

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Action failed' });
  }
};

exports.updateGroupDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, avatar } = req.body;
    
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.admins.includes(req.user._id)) return res.status(403).json({ message: 'Admin required' });

    if (name) chat.name = name;
    if (avatar) chat.avatar = avatar; 

    await chat.save();
    
    const io = req.app.get('io');
    if(io) io.to(chatId).emit('chat:updated', chat);

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
};

exports.leaveChat = async (req, res) => { 
    const userId = req.user._id.toString();
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    
    const newParticipants = chat.participants.filter(p => String(p) !== userId);
    
    if (newParticipants.length === 0) {
      await Chat.findByIdAndDelete(chat._id);
      await Message.deleteMany({ chat: chat._id });
      return res.json({ message: 'Chat deleted (empty)' });
    }

    // Admin Rotation if needed
    if (chat.isGroup) {
        chat.admins = (chat.admins || []).filter(a => String(a) !== userId);
        if (chat.admins.length === 0 && newParticipants.length > 0) {
            chat.admins.push(newParticipants[0]); // Promote next oldest
        }
    }

    chat.participants = newParticipants;
    // Create system message
    const sysMsg = await Message.create({ 
        chat: chat._id, 
        sender: req.user._id, 
        content: `${req.user.name} left.`, 
        type: 'system' 
    });

    chat.lastMessage = sysMsg._id;
    await chat.save();
    
    res.json({ message: 'Left group' });
};

exports.deleteChat = async (req, res) => { 
    await Message.deleteMany({ chat: req.params.chatId });
    await Chat.findByIdAndDelete(req.params.chatId);
    res.json({message:'Deleted'});
};

exports.editMessage = async (req, res) => { 
    await Message.findByIdAndUpdate(req.params.messageId, { content: req.body.newContent, editedAt: Date.now() });
    
    // Emit update event
    const io = req.app.get('io');
    if(io) io.emit('message:updated', { 
        chatId: req.params.chatId, 
        messageId: req.params.messageId, 
        newContent: req.body.newContent 
    });

    res.json({message:'Updated'});
};

exports.togglePinMessage = async (req, res) => { 
    const chat = await Chat.findById(req.params.chatId);
    if(chat.pinnedMessages.includes(req.params.messageId)) {
        chat.pinnedMessages.pull(req.params.messageId);
    } else {
        chat.pinnedMessages.push(req.params.messageId);
    }
    await chat.save();
    
    const io = req.app.get('io');
    if(io) io.to(req.params.chatId).emit('chat:pinned', { pinnedMessages: chat.pinnedMessages });

    res.json({pinnedMessages: chat.pinnedMessages});
};

exports.searchChat = async (req, res) => {
    const results = await Message.find({ chat: req.params.chatId, content: { $regex: req.query.q, $options: 'i' } });
    res.json(results);
};

exports.getUnreadCount = async (req, res) => { 
    const userId = req.user._id.toString();
    const chats = await Chat.find({ participants: userId });
    // Safe access to unread map
    const count = chats.reduce((acc, c) => acc + (c.unread && c.unread.get(userId) || 0), 0);
    res.json({ count });
};

exports.unsendMessage = async (req, res) => { 
    await Message.findByIdAndDelete(req.params.messageId); 
    res.json({message:'Deleted'}); 
};

exports.reactMessage = async (req, res) => { res.json({}); }; 

// Vote on Poll
exports.votePoll = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user._id;

        // 1. Remove previous vote by this user on this poll
        await Message.updateOne(
            { _id: messageId },
            { $pull: { "pollOptions.$[].votes": userId } }
        );

        // 2. Add new vote
        const msg = await Message.findOneAndUpdate(
            { _id: messageId },
            { $addToSet: { [`pollOptions.${optionIndex}.votes`]: userId } },
            { new: true }
        ).populate('sender', 'name avatar');

        if (!msg) return res.status(404).json({ message: 'Message not found' });

        // 3. Emit Update to Room
        const io = req.app.get('io');
        if (io) {
            io.to(String(msg.chat)).emit('message:updated', {
                chatId: msg.chat,
                messageId: msg._id,
                pollOptions: msg.pollOptions 
            });
        }

        res.json(msg);
    } catch (err) {
        console.error("Poll Vote Error:", err);
        res.status(500).json({ message: 'Vote failed' });
    }
};