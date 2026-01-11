// backend/middleware/validateContent.js
const Filter = require('bad-words');
const filter = new Filter();

// Optional: Add custom bad words
// filter.addWords('somebadword', 'anotherone');

module.exports = (req, res, next) => {
  try {
    const fieldsToCheck = ['content', 'text', 'caption', 'title', 'description', 'message'];
    
    for (const field of fieldsToCheck) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        if (filter.isProfane(req.body[field])) {
          return res.status(400).json({ 
            message: 'Your content contains inappropriate language. Please revise it.' 
          });
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};