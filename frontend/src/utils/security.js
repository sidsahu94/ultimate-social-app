// frontend/src/utils/security.js
import CryptoJS from 'crypto-js';

// 🔥 FIX: Read from Environment Variable
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "fallback_dev_key_only"; 

export const encryptMessage = (text) => {
  if (!text) return "";
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptMessage = (cipherText) => {
  try {
    if (!cipherText) return "";
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || "**Decryption Error**";
  } catch (e) {
    return "**Decryption Failed**";
  }
};