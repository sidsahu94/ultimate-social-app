// backend/utils/push.js
const webpush = require('web-push');

// 🔥 FIX: Read keys directly from environment variables
// This ensures consistency across server restarts.
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

// Validation: Check if keys are present
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.error("❌ FATAL ERROR: VAPID Keys are missing in .env file.");
    console.error("   Run 'npx web-push generate-vapid-keys' and add them to backend/.env");
} else {
    try {
        webpush.setVapidDetails(
            process.env.VAPID_EMAIL || 'mailto:admin@socialapp.com', // Use env email or fallback
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        console.log("✅ VAPID Keys configured for Web Push");
    } catch (err) {
        console.error("❌ Error setting VAPID details:", err.message);
    }
}

// Export the configured webpush instance and the public key for the frontend
module.exports = { 
    webpush, 
    publicKey: vapidKeys.publicKey 
};