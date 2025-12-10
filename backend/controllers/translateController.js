const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.translate = async (req,res)=>{
  try {
    const { text, to = 'en' } = req.body;
    if (!text) return res.json({ text:'' });
    const LT = process.env.LT_URL || 'https://libretranslate.de';
    const r = await fetch(`${LT}/translate`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ q:text, source:'auto', target:to, format:'text' })
    });
    const data = await r.json();
    res.json({ text: data.translatedText || text });
  } catch (e) {
    res.json({ text: req.body.text });
  }
};
