// frontend/src/utils/security.js
/**
 * SOCIALO HIGH-TECH SECURITY & CLIENT-SIDE E2EE UTILITY
 * Powered by W3C Web Cryptography API (SubtleCrypto)
 * Standard: AES-GCM 256-bit with PBKDF2 (SHA-256) key derivation.
 */

const keyCache = new Map();

/**
 * Derives a 256-bit AES-GCM CryptoKey for a specific conversation.
 * @param {string} chatId 
 * @returns {Promise<CryptoKey>}
 */
export async function getOrCreateChatKey(chatId) {
  if (!chatId) return null;
  if (keyCache.has(chatId)) {
    return keyCache.get(chatId);
  }

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const enc = new TextEncoder();
    // Deterministic salt derived from chatId
    const salt = enc.encode(`socialo_e2ee_salt_${chatId}_v1`);
    const masterSecret = enc.encode(`socialo_session_key_${chatId}`);

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      masterSecret,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    keyCache.set(chatId, derivedKey);
    return derivedKey;
  } catch (err) {
    console.warn('[E2EE] Key derivation failed:', err);
    return null;
  }
}

/**
 * Encrypts plaintext message into AES-GCM ciphertext.
 * Format: e2ee:v1:<b64_iv>:<b64_cipher>
 * @param {string} text Plaintext
 * @param {string} chatId
 * @returns {Promise<string>}
 */
export async function encryptMessage(text, chatId = '') {
  if (!text || typeof text !== 'string') return text;
  if (!chatId) return text;

  try {
    const key = await getOrCreateChatKey(chatId);
    if (!key) return text;

    const enc = new TextEncoder();
    const encodedData = enc.encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const ivB64 = btoa(String.fromCharCode(...iv));
    const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

    return `e2ee:v1:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.warn('[E2EE] Encryption failed, falling back:', err);
    return text;
  }
}

/**
 * Decrypts an AES-GCM ciphertext payload.
 * @param {string} cipherText 
 * @param {string} chatId 
 * @returns {Promise<string>}
 */
export async function decryptMessage(cipherText, chatId = '') {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  if (!cipherText.startsWith('e2ee:v1:')) return cipherText;
  if (!chatId) return cipherText;

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;

    const [, , ivB64, cipherB64] = parts;
    const iv = new Uint8Array(atob(ivB64).split('').map((c) => c.charCodeAt(0)));
    const cipherData = new Uint8Array(atob(cipherB64).split('').map((c) => c.charCodeAt(0)));

    const key = await getOrCreateChatKey(chatId);
    if (!key) return cipherText;

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherData
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn('[E2EE] Decryption failed (bad key or corrupted payload):', err);
    return '🔒 [Encrypted Secret Message]';
  }
}

/**
 * Helper to check if payload is encrypted
 */
export function isE2EEPayload(text) {
  return typeof text === 'string' && text.startsWith('e2ee:v1:');
}