// backend/routes/proxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// IMPORTANT: Whitelist remains strict for security.
// 🔥 FIX: Use exact hostnames to prevent subdomain bypass (e.g. images.unsplash.com.attacker.com)
const ALLOWED_HOSTS = [
    'res.cloudinary.com',
    'images.unsplash.com',
    'dl.dropboxusercontent.com',
    'i.imgur.com', 
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

        // 2. Fetch the external image as a stream
        // We set 'Authorization: undefined' to prevent passing our API token to external hosts
        const r = await axios.get(url, { 
            responseType: 'stream', 
            timeout: 20000,
            headers: {
                Authorization: undefined 
            }
        });

        // 3. Set necessary headers for the client
        const contentType = r.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
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