// backend/scripts/migrate_chats.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

dotenv.config();

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all chats that still have the old 'messages' array
    // Note: This requires the old Chat schema temporarily or using lean() / aggregation
    // Since we updated the Chat model file, mongoose might strip 'messages' if we query normally.
    // We use collection access to be safe.
    const chats = await mongoose.connection.collection('chats').find({ messages: { $exists: true, $ne: [] } }).toArray();

    console.log(`Found ${chats.length} chats to migrate.`);

    for (const chat of chats) {
      const oldMessages = chat.messages || [];
      if (oldMessages.length === 0) continue;

      console.log(`Migrating ${oldMessages.length} messages for Chat ${chat._id}...`);

      const newMessages = oldMessages.map(msg => ({
        chat: chat._id,
        sender: msg.sender,
        content: msg.content,
        media: msg.media,
        audio: msg.audio,
        replyTo: msg.replyTo,
        isForwarded: msg.isForwarded,
        readBy: msg.readBy || [],
        deliveredTo: msg.deliveredTo || [],
        reactions: msg.reactions || [],
        createdAt: msg.createdAt || new Date(),
        updatedAt: msg.updatedAt || new Date()
      }));

      // Bulk Insert for performance
      const inserted = await Message.insertMany(newMessages);
      
      // Update Chat: Set lastMessage and unset the messages array
      const lastMsgId = inserted[inserted.length - 1]._id;
      
      await mongoose.connection.collection('chats').updateOne(
        { _id: chat._id },
        { 
            $set: { lastMessage: lastMsgId },
            $unset: { messages: "" } // Remove the old array to free up space
        }
      );
    }

    console.log('🎉 Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
};

runMigration();