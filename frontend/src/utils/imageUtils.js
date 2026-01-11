// frontend/src/utils/imageUtils.js

/**
 * Optimizes Cloudinary URLs for performance.
 * @param {string} url - The original image URL
 * @param {string} variant - 'avatar' | 'feed' | 'story' | 'full'
 */
export const getImageUrl = (url, variant = 'feed') => {
  if (!url) return '/default-avatar.png';
  
  // If not Cloudinary, return as is (Local uploads or external links)
  if (!url.includes('cloudinary.com')) {
    // If it's a relative local path, prepend host
    if (url.startsWith('/')) return `http://${window.location.hostname}:5000${url}`;
    return url;
  }

  // Cloudinary Transformation Logic
  // We inject the transformation string after "/upload/"
  const parts = url.split('/upload/');
  if (parts.length < 2) return url;

  let params = 'q_auto,f_auto'; // Default: Auto quality & format (WebP/AVIF)

  switch (variant) {
    case 'avatar':
      params += ',w_150,h_150,c_fill,g_face'; // Small, square, focused on face
      break;
    case 'feed':
      params += ',w_800,c_limit'; // Max width 800px for feed
      break;
    case 'story':
      params += ',w_1080,h_1920,c_fill'; // Full screen vertical
      break;
    case 'thumbnail':
      params += ',w_300,h_300,c_fill'; // Grid view
      break;
    default:
      break; // 'full' keeps original dimensions but optimizes size
  }

  return `${parts[0]}/upload/${params}/${parts[1]}`;
};