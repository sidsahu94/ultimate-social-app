// frontend/src/utils/security.js
import CryptoJS from 'crypto-js';

// 🔥 SECURITY FIX: Strict Environment Check
// Ensure VITE_ENCRYPTION_KEY is set in your .env file
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

if (!SECRET_KEY && import.meta.env.PROD) {
  console.error("CRITICAL: Missing VITE_ENCRYPTION_KEY in production. Encryption features will fail safely.");
}

// Helper to get key or a dummy one for dev to prevent crashes (NEVER use dummy in prod)
const getKey = () => {
    if (SECRET_KEY) return SECRET_KEY;
    if (import.meta.env.DEV) return "dev_unsafe_fallback_key";
    return ""; // In prod without key, encryption fails rather than using a known key
};

export const encryptMessage = (text) => {
  const key = getKey();
  if (!text || !key) return "";
  try {
      return CryptoJS.AES.encrypt(text, key).toString();
  } catch (e) {
      console.error("Encryption failed:", e);
      return "";
  }
};

export const decryptMessage = (cipherText) => {
  const key = getKey();
  if (!cipherText || !key) return "";
  
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption produces empty string (wrong key), return error text
    if (!originalText) return "**Decryption Error: Invalid Key**";
    
    return originalText;
  } catch (e) {
    // Malformed ciphertext
    return "**Decryption Failed**";
  }
};