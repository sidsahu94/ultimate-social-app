// frontend/src/utils/imageUtils.js

/**
 * Optimizes Cloudinary URLs or handles local/relative paths.
 * @param {string} url - The original image URL
 * @param {string} variant - 'avatar' | 'feed' | 'story' | 'thumbnail'
 */
export const getImageUrl = (url, variant = 'feed') => {
  if (!url || typeof url !== 'string') return '/default-avatar.svg';
  
  // Normalize Windows separators
  let normalized = url.replace(/\\/g, '/').trim();
  if (!normalized) return '/default-avatar.svg';

  // 1. External URLs or Blobs or Data URLs
  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    // Cloudinary Transformation (only for images, do not break videos or audio)
    const isMediaVideoOrAudio = normalized.includes('/video/upload/') || normalized.match(/\.(mp4|webm|mov|mkv|mp3|wav|ogg|m4a)$/i);
    if (normalized.includes('cloudinary.com') && !isMediaVideoOrAudio) {
      const parts = normalized.split('/upload/');
      if (parts.length >= 2) {
        let params = 'q_auto,f_auto'; 
        switch (variant) {
          case 'avatar': params += ',w_150,h_150,c_fill,g_face'; break;
          case 'feed': params += ',w_800,c_limit'; break;
          case 'story': params += ',w_1080,h_1920,c_fill'; break;
          case 'thumbnail': params += ',w_300,h_300,c_fill'; break;
        }
        return `${parts[0]}/upload/${params}/${parts[1]}`;
      }
    }
    return normalized;
  }

  // 2. Local/Relative URLs - Prepend Backend URL or root slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  const backendUrl = import.meta.env.PROD 
    ? '' // In prod, relative paths are handled by the server
    : 'http://localhost:5000';

  return `${backendUrl}${normalized}`;
};