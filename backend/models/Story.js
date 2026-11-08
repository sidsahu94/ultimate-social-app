const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    media: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    privacy: { type: String, enum: ['public', 'close_friends'], default: 'public' },
    caption: { type: String, default: '' },
    color: { type: String, default: '#ffffff' },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, default: '❤️' },
        createdAt: { type: Date, default: Date.now }
    }],
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// --- INDEXES ---
StorySchema.index({ user: 1 });
// Auto-delete stories after 24 hours (86400 seconds TTL Index)
StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Story', StorySchema);
