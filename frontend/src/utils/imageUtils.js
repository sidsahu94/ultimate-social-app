export const getImageUrl = (url) => {
  if (!url) return '/default-avatar.png';
  
  // If it's an external link (Cloudinary, https, etc.), return as is
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return url;
  }

  // If it's a local upload path, prepend the Backend URL
  // Note: We use window.location.hostname to support mobile testing on LAN
  // Hardcoded to port 5000 based on your server.js
  return `http://${window.location.hostname}:5000${url.startsWith('/') ? '' : '/'}${url}`;
};