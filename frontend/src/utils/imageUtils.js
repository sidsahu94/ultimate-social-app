// frontend/src/utils/imageUtils.js

/**
 * Optimizes Cloudinary URLs or handles local/relative paths.
 * @param {string} url - The original image URL
 * @param {string} variant - 'avatar' | 'feed' | 'story' | 'thumbnail'
 */
export const getImageUrl = (url, variant = 'feed') => {
  if (!url) return '/default-avatar.png';
  
  // 1. External URLs (Google, Unsplash, etc.) - Return as is
  if (url.startsWith('http') && !url.includes('cloudinary.com')) {
      return url;
  }

  // 2. Local/Relative URLs - Prepend Backend URL
  // In development, this points to localhost:5000. In prod, it's relative.
  if (url.startsWith('/')) {
      const backendUrl = import.meta.env.PROD 
        ? '' // In prod, we use relative paths (proxy handles it)
        : 'http://localhost:5000';
      return `${backendUrl}${url}`;
  }

  // 3. Cloudinary Transformation
  if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length < 2) return url;

      let params = 'q_auto,f_auto'; 
      switch (variant) {
        case 'avatar': params += ',w_150,h_150,c_fill,g_face'; break;
        case 'feed': params += ',w_800,c_limit'; break;
        case 'story': params += ',w_1080,h_1920,c_fill'; break;
        case 'thumbnail': params += ',w_300,h_300,c_fill'; break;
      }
      return `${parts[0]}/upload/${params}/${parts[1]}`;
  }

  return url;
};