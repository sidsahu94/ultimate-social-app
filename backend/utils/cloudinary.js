const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

const isTransientError = (err) => {
	if (!err) return false;
	const msg = (err.message || '').toLowerCase();
	const code = err?.http_code || err?.status_code || err?.code || '';
	if (typeof code === 'number' && code >= 500) return true;
	if (/[timeout|timed out|request timeout|etimedout|econnreset|502|503|504]/i.test(msg)) return true;
	if (String(code).includes('ECONN') || String(code).includes('ETIMEDOUT')) return true;
	return false;
};

/**
 * Upload a local file to Cloudinary with retries and exponential backoff.
 * @param {string} filePath - local path
 * @param {string} folder - Cloudinary folder
 * @param {object} opts - optional extra options passed to uploader
 * @returns {Promise<object>} cloudinary result
 */
const uploads = (filePath, folder = 'ultimate_social', opts = {}) =>
	new Promise((resolve, reject) => {
		if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
			try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
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

				if (isTransientError(err) && attempt < maxAttempts) {
					const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000); 
					console.warn(`Cloudinary upload attempt ${attempt} failed; retrying after ${delay}ms`, (err && (err.message || err)).toString());
					return setTimeout(tryOnce, delay);
				}

				// Final failure -> remove local file and reject
				console.error('Cloudinary upload failed (final):', err && (err.message || err));
				try { fs.unlinkSync(filePath); } catch (e) { /* ignore unlink errors */ }
				return reject(err || new Error('Cloudinary upload failed'));
			});
		};

		tryOnce();
	});
// ... (uploadsStream remains the same) ...
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