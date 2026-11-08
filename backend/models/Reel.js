const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  videoUrl: {
    type: String,
    required: true
  },

  caption: {
    type: String,
    default: ''
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  views: {
    type: Number,
    default: 0
  },

  tags: [{
    type: String
  }]

}, {
  timestamps: true
});

// --- INDEXES ---

reelSchema.index({
  createdAt: -1
});

reelSchema.index({
  user: 1
});

module.exports =
  mongoose.model(
    'Reel',
    reelSchema
  );