// simple heuristics: extract hashtags + most frequent nouns via regex + stopwords
const stop = new Set(['the','a','and','of','to','in','for','on','is','with','that','this','it','an','as','are']);

exports.suggest = async (req,res)=>{
  const txt = (req.body.text||'').toLowerCase();
  const tags = new Set();
  // existing hashtags
  (txt.match(/#\w+/g) || []).forEach(h => tags.add(h.slice(1)));
  // word frequency
  const words = txt.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
  const freq = {};
  for (const w of words) {
    if (w.length<3) continue;
    if (stop.has(w)) continue;
    freq[w] = (freq[w]||0)+1;
  }
  const candidates = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
  candidates.forEach(c => tags.add(c));
  res.json({ suggestions: Array.from(tags).slice(0,8) });
};
