// controllers/commentsController.js
const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const postId = req.params.postId;
    const comment = new Comment({ post: postId, user: req.user._id, content });
    await comment.save();

    // attach to post
    const post = await Post.findById(postId);
    post.comments.push(comment._id);
    await post.save();

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const { content } = req.body;
    const parent = await Comment.findById(req.params.commentId);
    const reply = new Comment({ post: parent.post, user: req.user._id, content });
    await reply.save();
    parent.replies.push(reply._id);
    await parent.save();
    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
