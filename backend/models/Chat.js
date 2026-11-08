const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    chatName: { type: String, trim: true, default: '' }, // legacy alias
    isGroup: { type: Boolean, default: false },
    isGroupChat: { type: Boolean, default: false }, // legacy alias

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],

    unread: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    isSecret: {
      type: Boolean,
      default: false,
    },

    ephemeralDuration: {
      type: Number,
      default: 0, // 0 = disabled, or duration in seconds (e.g. 10, 60, 3600, 86400)
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.pre('save', function normalize(next) {
  if (!this.chatName && this.name) this.chatName = this.name;
  if (!this.name && this.chatName) this.name = this.chatName;
  if (typeof this.isGroupChat !== 'boolean') this.isGroupChat = !!this.isGroup;
  if (typeof this.isGroup !== 'boolean') this.isGroup = !!this.isGroupChat;
  next();
});

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);