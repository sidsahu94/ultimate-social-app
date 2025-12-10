const Post = require('../models/Post');

exports.createPollPost = async (req,res)=>{
  const { question, options = [], expiresAt } = req.body;
  if (!question || !options.length) return res.status(400).json({message:'Invalid poll'});
  const post = await Post.create({
    user: req.user._id,
    poll: { question, options: options.map(t => ({ text:t })), expiresAt: expiresAt? new Date(expiresAt) : null }
  });
  await post.populate('user','name avatar');
  res.status(201).json(post);
};

exports.vote = async (req,res)=>{
  const { id, index } = req.params;
  const post = await Post.findById(id);
  if (!post || !post.poll) return res.status(404).json({message:'Poll not found'});
  // remove previous votes
  post.poll.options.forEach(o => o.votes = (o.votes||[]).filter(u => u.toString() !== req.user._id.toString()));
  // add new
  post.poll.options[Number(index)].votes.push(req.user._id);
  await post.save();
  await post.populate('user','name avatar');
  res.json(post);
};
