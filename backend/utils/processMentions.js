const User = require('../models/User');
const createNotification = require('./notify');

/**
 * Extracts @mentions from text and notifies users
 * @param {string} text - Post content
 * @param {object} req - Express request (for user info/context)
 * @param {string} postId - ID of the post where mention occurred
 */
const processMentions = async (text, req, postId) => {
    if (!text || typeof text !== 'string' || !text.includes('@')) return;

    // Regex to find @names
    // Matches @ followed by word characters (letters, numbers, underscores)
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);

    if (!matches) return;

    // Remove duplicates and strip the '@' symbol
    const uniqueHandles = [...new Set(matches.map(m => m.slice(1)))];

    if (uniqueHandles.length === 0) return;

    // Find users by name 
    // NOTE: This assumes 'name' matches the handle. 
    // In a production system with usernames, you'd query { username: { $in: uniqueHandles } }
    // Using Regex here allows case-insensitive partial matching if needed, but precise match is safer for notifs.
    const users = await User.find({ 
        name: { $in: uniqueHandles },
        isDeleted: { $ne: true } // Don't notify deleted users
    }).select('_id');

    // Send notifications to each found user
    for (const user of users) {
        // Don't notify self
        if (req.user && String(user._id) === String(req.user._id)) continue;

        await createNotification(req, {
            toUser: user._id,
            type: 'mention',
            data: { postId },
            message: `${req.user.name} mentioned you in a post`
        });
    }
};

module.exports = processMentions;