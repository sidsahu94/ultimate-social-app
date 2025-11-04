// backend/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Heuristic to identify transient errors worth retrying.
 */
const isTransientError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = err?.http_code || err?.status_code || err?.code || '';
  // transient HTTP 5xx or gateway/timeouts or connection resets
  if (typeof code === 'number' && code >= 500) return true;
  if (/[timeout|timed out|request timeout|etimedout|econnreset|502|503|504]/i.test(msg)) return true;
  if (String(code).includes('ECONN') || String(code).includes('ETIMEDOUT')) return true;
  return false;
};

/**
 * Upload a local file to Cloudinary with retries and exponential backoff.
 * Will NOT unlink the local file unless upload succeeds.
 *
 * @param {string} filePath - local path
 * @param {string} folder - Cloudinary folder
 * @param {object} opts - optional extra options passed to uploader
 * @returns {Promise<object>} cloudinary result
 */
const uploads = (filePath, folder = 'ultimate_social', opts = {}) =>
  new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error('CLOUDINARY env not configured'));
    }

    const maxAttempts = Number(process.env.CLOUDINARY_UPLOAD_RETRIES || 3);
    let attempt = 0;

    const tryOnce = () => {
      attempt += 1;
      const options = Object.assign({ folder, resource_type: 'auto' }, opts);

      cloudinary.uploader.upload(filePath, options, (err, result) => {
        if (!err && result) {
          // success -> remove local temp file (best-effort)
          try { fs.unlinkSync(filePath); } catch (e) { /* ignore unlink errors */ }
          return resolve(result);
        }

        // if transient and we have retries left -> retry with backoff
        if (isTransientError(err) && attempt < maxAttempts) {
          const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000); // 2s, 4s, 8s...
          console.warn(`Cloudinary upload attempt ${attempt} failed; retrying after ${delay}ms`, (err && (err.message || err)).toString());
          return setTimeout(tryOnce, delay);
        }

        // Not retrying (final)
        console.error('Cloudinary upload failed (final):', err && (err.message || err));
        return reject(err || new Error('Cloudinary upload failed'));
      });
    };

    tryOnce();
  });

/**
 * Upload via stream (useful alternative for certain environments).
 * Caller should pipe a stream into the returned uploadStream.
 *
 * Example:
 * const stream = fs.createReadStream(filePath);
 * const res = await uploadsStream(stream, 'folder');
 */
const uploadsStream = (readableStream, folder = 'ultimate_social', opts = {}) =>
  new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error('CLOUDINARY env not configured'));
    }
    const options = Object.assign({ folder, resource_type: 'auto' }, opts);
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    readableStream.pipe(uploadStream);
  });

module.exports = {
  uploads,
  uploadsStream,
  cloudinary,
};
