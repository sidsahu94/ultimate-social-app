// backend/utils/cloudinary.js
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

const safeUnlink = (path) => {
    try {
        if (fs.existsSync(path)) fs.unlinkSync(path);
    } catch (e) {
        console.error(`Failed to delete local file: ${path}`, e.message);
    }
};

/**
 * Upload a local file to Cloudinary with retries and exponential backoff.
 * 🔥 GUARANTEED CLEANUP: Local file is deleted in finally block.
 */
const uploads = (filePath, folder = 'ultimate_social', opts = {}) =>
	new Promise((resolve, reject) => {
		if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
			safeUnlink(filePath);
			return reject(new Error('CLOUDINARY env not configured'));
		}

		const maxAttempts = Number(process.env.CLOUDINARY_UPLOAD_RETRIES || 3);
		let attempt = 0;

		const tryOnce = () => {
			attempt += 1;
			const options = Object.assign({ folder, resource_type: 'auto' }, opts);

			cloudinary.uploader.upload(filePath, options, (err, result) => {
				if (!err && result) {
                    safeUnlink(filePath); // Success cleanup
					return resolve(result);
				}

				if (isTransientError(err) && attempt < maxAttempts) {
					const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000); 
					console.warn(`Cloudinary upload attempt ${attempt} failed; retrying after ${delay}ms`, (err && (err.message || err)).toString());
					return setTimeout(tryOnce, delay);
				}

				// Final failure
				console.error('Cloudinary upload failed (final):', err && (err.message || err));
                safeUnlink(filePath); // Failure cleanup
				return reject(err || new Error('Cloudinary upload failed'));
			});
		};

		tryOnce();
	});

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


// 🔥 NEW: Extract Public ID and Delete
const deleteFile = async (url) => {
    if (!url || !url.includes('cloudinary')) return;
    try {
        // Extract public_id from URL: 
        // matches "folder/filename" before the extension
        const regex = /\/v\d+\/([^/]+)\.[a-z]+$/;
        const match = url.match(regex);
        // Or simpler split logic depending on your folder structure
        // Assuming format: .../upload/v1234/ultimate_social/filename.jpg
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder = 'ultimate_social'; // Match the folder name used in uploads
        const publicId = `${folder}/${filename}`;

        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted Cloudinary image: ${publicId}`);
    } catch (err) {
        console.error("Cloudinary delete failed:", err.message);
    }
};

module.exports = {
	uploads,
	uploadsStream,
    deleteFile, // Export it
	cloudinary,
};