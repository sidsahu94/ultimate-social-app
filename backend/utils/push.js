// backend/utils/push.js
const webpush = require('web-push');

let publicKey = process.env.VAPID_PUBLIC_KEY;
let privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
  try {
    const generated = webpush.generateVAPIDKeys();
    publicKey = generated.publicKey;
    privateKey = generated.privateKey;
    console.log("ℹ️ Auto-generated ephemeral VAPID keys for Web Push notifications");
  } catch (err) {
    console.warn("⚠️ Web Push VAPID generation fallback:", err.message);
  }
}

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@socialapp.com',
      publicKey,
      privateKey
    );
    console.log("✅ VAPID Keys configured for Web Push");
  } catch (err) {
    console.warn("⚠️ Error configuring VAPID details:", err.message);
  }
}

module.exports = {
  webpush,
  publicKey
};
