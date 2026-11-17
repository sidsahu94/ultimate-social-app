// backend/controllers/translateController.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.translate = async (req,res)=>{
  try {
    const { text, to, targetLang } = req.body;
    const target = to || targetLang || 'en';
    if (!text) return res.json({ text:'', translatedText: '' });
    const LT = process.env.LT_URL || 'https://libretranslate.de';
    const r = await fetch(`${LT}/translate`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ q:text, source:'auto', target, format:'text' })
    });
    const data = await r.json();
    const result = data.translatedText || text;
    res.json({ text: result, translatedText: result });
  } catch (e) {
    res.json({ text: req.body.text || '', translatedText: req.body.text || '' });
  }
};
