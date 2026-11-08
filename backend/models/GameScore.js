const mongoose = require('mongoose');

const GameScoreSchema =
  new mongoose.Schema({

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    gameId: {
      type: String,
      required: true
    },

    score: {
      type: Number,
      required: true
    }

  }, {
    timestamps: true
  });

// --- INDEXES ---

GameScoreSchema.index({
  gameId: 1,
  score: -1
});

GameScoreSchema.index({
  user: 1
});

module.exports =
  mongoose.model(
    'GameScore',
    GameScoreSchema
  );