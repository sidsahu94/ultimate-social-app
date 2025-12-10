// backend/middleware/bannedWords.js
const fs = require('fs');
const path = require('path');

let banned = [];
try {
  const p = path.join(__dirname, '..', 'config', 'banned-words.txt');
  if (fs.existsSync(p)) banned = fs.readFileSync(p, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
} catch(e){}

module.exports = (req, res, next) => {
  const text = (req.body?.content || req.body?.caption || '') + '';
  if (!text) return next();
  const lower = text.toLowerCase();
  for (const w of banned) {
    if (!w) continue;
    if (lower.includes(w.toLowerCase())) {
      return res.status(400).json({ message: 'Content contains banned words' });
    }
  }
  next();
};
