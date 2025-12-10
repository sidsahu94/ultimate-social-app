const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')()
]);
const got = require('got');

exports.unfurl = async (req,res)=>{
  try {
    const { url } = req.body;
    const { body: html } = await got(url);
    const meta = await metascraper({ html, url });
    res.json(meta);
  } catch {
    res.json({});
  }
}
