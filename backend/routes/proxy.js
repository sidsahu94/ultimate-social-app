// backend/routes/proxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// IMPORTANT: Whitelist remains strict for security.
// 🔥 Strict image CDN whitelist: user-upload relays like Dropbox & Imgur removed
const ALLOWED_HOSTS = [
    'res.cloudinary.com',
    'images.unsplash.com',       // Required for Seed Data
    'plus.unsplash.com',         // Required for Unsplash
    'loremflickr.com',           // Required for Faker/Seed Data
    'avatars.githubusercontent.com',
    'lh3.googleusercontent.com', // Google Auth avatars
];

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif'
];

router.get('/image', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ message: 'url param required' });

    try {
        // 1. URL Validation
        const parsed = new URL(url);
        
        // 🔥 SECURITY FIX: Strict Hostname Check
        if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
            console.error(`Proxy rejected: Host not allowed: ${parsed.hostname}`);
            return res.status(403).json({ message: 'Host not allowed' });
        }

        // 2. Fetch the external image as a stream with strict 5MB limit
        const r = await axios.get(url, { 
            responseType: 'stream', 
            timeout: 15000,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            headers: {
                Authorization: undefined 
            }
        });

        // 3. Strict Content-Type verification
        const rawContentType = (r.headers['content-type'] || '').toLowerCase().split(';')[0].trim();
        if (!ALLOWED_MIME_TYPES.includes(rawContentType)) {
            console.error(`Proxy rejected: Content-Type ${rawContentType} not an allowed image MIME`);
            return res.status(415).json({ message: 'Invalid content type. Only verified image streams permitted.' });
        }

        res.setHeader('Content-Type', rawContentType);
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        
        // Pass through caching headers if available
        if (r.headers['cache-control']) res.setHeader('Cache-Control', r.headers['cache-control']);
        if (r.headers['content-length']) res.setHeader('Content-Length', r.headers['content-length']);

        // 4. Pipe the data stream directly to the response
        r.data.pipe(res);
        
        // Handle stream errors
        r.data.on('error', (err) => {
            console.error('Proxy stream pipe error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Image stream failed' });
            }
        });

    } catch (err) {
        // Log the error detail
        const errorMsg = err?.message || err;
        console.error(`Proxy fetch or server error for ${url}: ${errorMsg}`);
        
        // 5. Handle Final Error Response
        if (!res.headersSent) {
            const statusCode = err.response?.status || 502;
            return res.status(statusCode).json({ message: `Proxy fetch failed: ${errorMsg}` });
        }
        res.end(); 
    }
});

module.exports = router;