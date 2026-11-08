// backend/models/Post.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    videos: [
      {
        type: String,
        trim: true,
      },
    ],

    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
      index: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isFlagged: {
      type: Boolean,
      default: false,
    },

    isPaywalled: {
      type: Boolean,
      default: false,
    },

    unlockPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    unlockedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    isDraft: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    publishAt: {
      type: Date,
      default: null,
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },

    allowComments: {
      type: Boolean,
      default: true,
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    link: {
      type: String,
      trim: true,
      default: '',
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
});

PostSchema.index({ hashtags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ score: -1, createdAt: -1 });

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);