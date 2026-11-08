const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

let createNotification = async () => {};
try {
  createNotification = require('../utils/notify');
} catch (_) {}

const asIds = (arr = []) => [...new Set(arr.map(String).filter(Boolean))];
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const chatPopulate = [
  { path: 'participants', select: 'name avatar isVerified userStatus role blockedUsers' },
  { path: 'admins', select: 'name avatar role' },
  {
    path: 'lastMessage',
    select: 'content sender createdAt isForwarded media audio type isEncrypted editedAt deletedAt',
    populate: { path: 'sender', select: 'name avatar' },
  },
  {
    path: 'pinnedMessages',
    select: 'content sender createdAt media audio type isEncrypted isForwarded editedAt',
    populate: { path: 'sender', select: 'name avatar' },
  },
];

const messagePopulate = [
  { path: 'sender', select: 'name avatar' },
  {
    path: 'replyTo',
    select: 'content sender isEncrypted media audio',
    populate: { path: 'sender', select: 'name avatar' },
  },
];

const toIdString = (p) => (p && p._id ? String(p._id) : String(p || ''));

const emitToChat = async (req, chat, event, payload) => {
  const io = req.app.get('io') || global.io;
  if (!io || !chat?.participants) return;
  chat.participants.forEach((p) => {
    const pid = toIdString(p);
    if (pid) io.to(pid).emit(event, payload);
  });
};

const ensureParticipant = (chat, userId) => {
  const uid = String(userId?._id || userId || '');
  return chat?.participants?.some((p) => toIdString(p) === uid);
};

const findChatOrFail = async (chatId, userId, res) => {
  if (!isValidId(chatId)) {
    res.status(400).json({ message: 'Invalid chat id' });
    return null;
  }
  const chat = await Chat.findById(chatId).populate(chatPopulate);
  if (!chat) {
    res.status(404).json({ message: 'Chat not found' });
    return null;
  }
  if (!ensureParticipant(chat, userId) && String(userId.role || '') !== 'admin') {
    res.status(403).json({ message: 'Not allowed' });
    return null;
  }
  return chat;
};

exports.createChat = async (req, res) => {
  try {
    const participants = req.body.participants || [];
    const name = String(req.body.name || '').trim();
    const isGroup = Boolean(req.body.isGroup);

    const memberIds = asIds([...(participants || []), req.user._id.toString()]);
    if (memberIds.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 members' });
    }

    const otherMembers = memberIds.filter((id) => id !== String(req.user._id));
    const [me, targets] = await Promise.all([
      User.findById(req.user._id).select('blockedUsers'),
      User.find({ _id: { $in: otherMembers } }).select('blockedUsers'),
    ]);

    for (const t of targets) {
      if (me?.blockedUsers?.map(String).includes(String(t._id)) || t.blockedUsers?.map(String).includes(String(me._id))) {
        return res.status(403).json({ message: 'You cannot chat with this user (Blocked).' });
      }
    }

    if (!isGroup && memberIds.length === 2) {
      const existing = await Chat.findOne({
        isGroup: false,
        participants: { $all: memberIds, $size: 2 },
      })
        .populate(chatPopulate)
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name avatar' },
        });

      if (existing) return res.json(existing);
    }

    const chat = await Chat.create({
      participants: memberIds,
      name: isGroup ? name : '',
      chatName: isGroup ? name : '',
      isGroup,
      isGroupChat: isGroup,
      admins: isGroup ? [req.user._id] : [],
      unread: {},
      pinnedMessages: [],
    });

    const populated = await Chat.findById(chat._id).populate(chatPopulate);

    await emitToChat(req, populated, 'chat:created', populated);
    res.status(201).json(populated);
  } catch (e) {
    console.error('createChat error:', e);
    res.status(500).json({ message: 'Error creating chat' });
  }
};

exports.createGroupChat = async (req, res) => {
  req.body.isGroup = true;
  return exports.createChat(req, res);
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate(chatPopulate)
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error('getChats Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate(chatPopulate);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const limit = 50;
    const cursor = req.query.cursor || req.query.before;
    const query = { chat: chatId };

    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(messagePopulate)
      .lean();

    const nextCursor = messages.length ? messages[messages.length - 1].createdAt : null;

    res.json({
      ...chat.toObject(),
      messages: messages.slice().reverse(),
      nextCursor,
    });
  } catch (err) {
    console.error('getChatById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).select('participants');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const limit = 50;
    const cursor = req.query.before || req.query.cursor;
    const query = { chat: chatId };
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(messagePopulate)
      .lean();

    res.json(messages);
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const {
      content = '',
      media = null,
      audio = null,
      replyTo = null,
      isForwarded = false,
      isEncrypted = false,
      isEphemeral = false,
      ephemeralDuration = 0,
      type = 'text',
      pollOptions = [],
    } = req.body;

    const duration = ephemeralDuration || chat.ephemeralDuration || 0;
    const shouldExpire = isEphemeral || duration > 0;
    const expiresAt = shouldExpire && duration > 0 ? new Date(Date.now() + duration * 1000) : null;

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      media,
      audio,
      replyTo: replyTo || null,
      isForwarded,
      isEncrypted: isEncrypted || !!chat.isSecret,
      isEphemeral: shouldExpire,
      ephemeralDuration: duration,
      expiresAt,
      type,
      pollOptions,
    });

    const updateOps = {
      $set: { lastMessage: message._id, updatedAt: new Date() },
      $inc: {},
    };

    chat.participants.forEach((p) => {
      const pid = toIdString(p);
      if (pid && pid !== String(req.user._id)) {
        updateOps.$inc[`unread.${pid}`] = 1;
      }
    });

    await Chat.findByIdAndUpdate(chatId, updateOps);

    const populatedMsg = await Message.findById(message._id).populate(messagePopulate);

    await emitToChat(req, chat, 'receiveMessage', { chatId, message: populatedMsg });

    res.json(populatedMsg);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { newContent, content, isEncrypted } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg || String(msg.chat) !== String(chatId)) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.sender) !== String(req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    msg.content = typeof newContent === 'string' ? newContent : (typeof content === 'string' ? content : msg.content);
    if (typeof isEncrypted === 'boolean') msg.isEncrypted = isEncrypted;
    msg.editedAt = new Date();
    await msg.save();

    const populated = await Message.findById(msg._id).populate(messagePopulate);
    const chat = await Chat.findById(chatId).select('participants');
    await emitToChat(req, chat, 'message:updated', {
      chatId,
      messageId: msg._id,
      newContent: populated.content,
      editedAt: populated.editedAt,
      pollOptions: populated.pollOptions,
    });

    res.json(populated);
  } catch (err) {
    console.error('updateMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const msg = await Message.findById(messageId);
    if (!msg || String(msg.chat) !== String(chatId)) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.sender) !== String(req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await Message.findByIdAndUpdate(messageId, {
      deletedAt: new Date(),
      content: '[deleted]',
      media: null,
      audio: null,
      isSystem: true,
    });

    const chat = await Chat.findById(chatId).select('participants');
    await emitToChat(req, chat, 'message:deleted', { chatId, messageId });

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) return res.status(403).json({ message: 'Not allowed' });

    chat.unread = chat.unread || {};
    chat.unread[String(req.user._id)] = 0;
    await chat.save();

    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const chat = await Chat.findById(chatId).populate(chatPopulate);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) return res.status(403).json({ message: 'Not allowed' });

    const exists = chat.pinnedMessages.map(String).includes(String(messageId));
    if (exists) {
      chat.pinnedMessages = chat.pinnedMessages.filter((id) => String(id) !== String(messageId));
    } else {
      chat.pinnedMessages.push(messageId);
      await Message.findByIdAndUpdate(messageId, { isPinned: true });
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);

    await emitToChat(req, updated, 'chat:pinned', {
      chatId,
      pinnedMessages: updated.pinnedMessages,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('togglePin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGroupDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) || !chat.isGroup) return res.status(403).json({ message: 'Not allowed' });

    if (!chat.admins.map(String).includes(String(req.user._id)) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const nextName = String(req.body.name || req.body.chatName || '').trim();
    if (nextName) {
      chat.name = nextName;
      chat.chatName = nextName;
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);
    await emitToChat(req, updated, 'chat:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateGroupDetails error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.manageMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, action } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroup) return res.status(400).json({ message: 'Not a group chat' });

    if (!chat.admins.map(String).includes(String(req.user._id)) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    if (!isValidId(userId)) return res.status(400).json({ message: 'Invalid user id' });

    if (action === 'add') {
      if (!chat.participants.map(toIdString).includes(String(userId))) chat.participants.push(userId);
    } else if (action === 'remove') {
      chat.participants = chat.participants.filter((id) => toIdString(id) !== String(userId));
      chat.admins = chat.admins.filter((id) => toIdString(id) !== String(userId));
    } else if (action === 'promote') {
      if (!chat.admins.map(toIdString).includes(String(userId))) chat.admins.push(userId);
    } else if (action === 'demote') {
      chat.admins = chat.admins.filter((id) => toIdString(id) !== String(userId));
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);
    await emitToChat(req, updated, 'chat:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('manageMembers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroup) return res.status(400).json({ message: 'Not a group chat' });

    chat.participants = chat.participants.filter((id) => toIdString(id) !== String(req.user._id));
    chat.admins = chat.admins.filter((id) => toIdString(id) !== String(req.user._id));

    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
      return res.json({ success: true, deleted: true });
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);
    await emitToChat(req, updated, 'chat:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('leaveGroup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);

    const chat = await Chat.findById(chatId).select('participants');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results = await Message.find({
      chat: chatId,
      content: regex,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate(messagePopulate);

    res.json(results);
  } catch (err) {
    console.error('searchMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.type !== 'poll') return res.status(400).json({ message: 'Not a poll' });

    message.pollOptions = (message.pollOptions || []).map((opt) => ({
      ...opt.toObject?.() || opt,
      votes: (opt.votes || []).filter((id) => String(id) !== String(req.user._id)),
    }));

    const target = message.pollOptions[Number(optionIndex)];
    if (!target) return res.status(400).json({ message: 'Invalid option' });
    target.votes = [...(target.votes || []), req.user._id];

    await message.save();

    const populated = await Message.findById(messageId).populate(messagePopulate);
    const chat = await Chat.findById(message.chat).select('participants');
    await emitToChat(req, chat, 'message:updated', {
      chatId: String(message.chat),
      messageId: message._id,
      pollOptions: populated.pollOptions,
    });

    res.json({ success: true, pollOptions: populated.pollOptions });
  } catch (err) {
    console.error('votePoll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
    res.json({ success: true, message: 'Chat deleted' });
  } catch (err) {
    console.error('deleteChat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleEphemeral = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { ephemeralDuration, isSecret } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (typeof ephemeralDuration === 'number') {
      chat.ephemeralDuration = Math.max(0, ephemeralDuration);
    }
    if (typeof isSecret === 'boolean') {
      chat.isSecret = isSecret;
    }
    await chat.save();

    await emitToChat(req, chat, 'chatSettingsUpdated', {
      chatId,
      ephemeralDuration: chat.ephemeralDuration,
      isSecret: chat.isSecret,
    });

    res.json({
      success: true,
      chatId,
      ephemeralDuration: chat.ephemeralDuration,
      isSecret: chat.isSecret,
    });
  } catch (err) {
    console.error('toggleEphemeral error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// aliases
exports.accessChat = exports.createChat;
exports.fetchChats = exports.getChats;
exports.allMessages = async (req, res) => {
  req.query.before = req.query.before || req.query.cursor;
  return exports.getMessages(req, res);
};
exports.renameGroup = exports.updateGroupDetails;
exports.addToGroup = async (req, res) => {
  req.body.action = 'add';
  return exports.manageMembers(req, res);
};
exports.removeFromGroup = async (req, res) => {
  req.body.action = 'remove';
  return exports.manageMembers(req, res);
};