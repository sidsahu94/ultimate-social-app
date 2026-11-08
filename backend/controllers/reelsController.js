// backend/controllers/reelsController.js
const Reel = require('../models/Reel');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fs = require('fs');
const path = require('path');
const cloudinaryUtil = require('../utils/cloudinary');
const { deleteFile } = require('../utils/cloudinary');

// ---------------- SAFE UPLOAD ----------------
const safeUpload = async (filePath) => {
  try {
    const r = await cloudinaryUtil.uploads(
      filePath,
      'social_reels',
      { resource_type: 'video' }
    );
    try { fs.unlinkSync(filePath); } catch {}
    return r.secure_url;
  } catch (e) {
    console.error('Reel upload error', e);
    return `/uploads/${path.basename(filePath)}`;
  }
};

// ---------------- UPLOAD REEL ----------------
exports.uploadReel = async (req, res) => {
  try {
    if (!req.files?.length && !req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const file = req.files ? req.files[0] : req.file;
    const url = await safeUpload(file.path);

    const reel = new Reel({
      user: req.user._id,
      videoUrl: url,
      caption: req.body.caption || '',
      tags: [],
    });

    await reel.save();
    await reel.populate('user', 'name avatar');

    res.status(201).json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- FEED ----------------
exports.feed = async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    const reelsWithMeta = reels.map((r) => ({
      ...r.toObject(),
      isLikedByMe: req.user
        ? r.likes.some((u) => u.toString() === req.user._id.toString())
        : false,
    }));

    
    if (!reelsWithMeta || reelsWithMeta.length === 0) {
      const demoReels = [
        {
          _id: 'demo1',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/dog.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/dog.jpg',
          caption: 'Golden hours & cinematic freedom ✨🐕 #SocialoMoments #CinematicNoir',
          user: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1', 'user2', 'user3'],
          comments: [1, 2]
        },
        {
          _id: 'demo2',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/sea_turtle.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/sea_turtle.jpg',
          caption: 'Azure currents & deep tranquility 🌊🐢 #OceanDrift #NatureArt',
          user: { name: 'Kai Sterling', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1'],
          comments: []
        },
        {
          _id: 'demo3',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/elephants.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/elephants.jpg',
          caption: 'Serengeti sovereigns under dusk 🐘🌅 #Wildlife #MajesticEarth',
          user: { name: 'Aria Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1', 'user2'],
          comments: [1]
        },
        {
          _id: 'demo4',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/samples/cld-sample-video.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/samples/cld-sample-video.jpg',
          caption: 'Precision cadence & fluid motion ⚡🏎️ #SpeedCraft #NoirVision',
          user: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1', 'user2', 'user3', 'user4'],
          comments: [1, 2, 3]
        }
      ];
      return res.json(demoReels);
    }

    res.json(reelsWithMeta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- LIKE / UNLIKE REEL ----------------
exports.likeReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const uid = req.user._id.toString();
    const index = reel.likes.findIndex(
      (u) => u.toString() === uid
    );

    if (index === -1) {
      reel.likes.push(req.user._id);
    } else {
      reel.likes.splice(index, 1);
    }

    await reel.save();
    res.json({ success: true, likes: reel.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------- INCREMENT VIEW ----------------
exports.viewReel = async (req, res) => {
  try {
    const { id } = req.params;
    await Reel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false }); 
  }
};

// ---------------- TIP REEL CREATOR ----------------
exports.tipReel = async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Math.max(1, Math.floor(Number(req.body.amount || 10)));
    const userId = req.user._id;

    let reel = null;
    if (!String(id).startsWith('demo')) {
      reel = await Reel.findById(id).populate('user', 'name avatar');
    }

    const creatorId = reel?.user?._id || reel?.user;
    if (creatorId && String(creatorId) === String(userId)) {
      return res.status(400).json({ success: false, message: 'Cannot tip your own reel' });
    }

    const sender = await User.findById(userId);
    const senderBalance = Number(sender?.wallet?.balance || 0);
    if (senderBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Treasury coins (${senderBalance} coins available). Claim your daily bonus in Wallet!`
      });
    }

    // Debit sender
    const updatedSender = await User.findByIdAndUpdate(
      userId,
      { $inc: { 'wallet.balance': -amount, 'wallet.totalSent': amount } },
      { new: true }
    );

    // Credit creator if not demo
    let creatorName = reel?.user?.name || 'Creator';
    if (creatorId) {
      const updatedCreator = await User.findByIdAndUpdate(
        creatorId,
        { $inc: { 'wallet.balance': amount, 'wallet.totalReceived': amount } },
        { new: true }
      );

      const io = req.app.get('io') || global.io;
      if (io) {
        io.to(String(creatorId)).emit('wallet:update', {
          balance: updatedCreator.wallet.balance,
          amount,
          message: `${sender.name} tipped you ${amount} coins on your reel! 💎`
        });
      }
    }

    const txKey = `reeltip:${userId}:${id}:${Date.now()}`;
    await Transaction.create([
      {
        user: userId,
        type: 'debit',
        amount,
        description: `Tipped ${creatorName} on reel`,
        idempotencyKey: txKey
      }
    ]).catch(e => console.warn('Tip tx log error:', e.message));

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(userId)).emit('wallet:update', { balance: updatedSender.wallet.balance });
    }

    res.json({
      success: true,
      message: `Successfully tipped ${amount} coins to ${creatorName}!`,
      balance: updatedSender.wallet.balance,
      amount
    });
  } catch (err) {
    console.error('tipReel err', err);
    res.status(500).json({ success: false, message: 'Server error during tip' });
  }
};

// ---------------- DELETE REEL ----------------
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    // Check ownership
    if (String(reel.user) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    if (reel.videoUrl) {
        await deleteFile(reel.videoUrl).catch(() => {});
    }

    await Reel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reel deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
