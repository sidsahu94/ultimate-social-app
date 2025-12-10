import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils'; // Import the helper

const UserAvatar = ({ src, name, className = "w-10 h-10" }) => {
  const [error, setError] = useState(false);

  // Apply the URL fix
  const processedSrc = getImageUrl(src);
  
  // Fallback logic
  const finalSrc = error ? '/default-avatar.png' : processedSrc;

  return (
    <img
      src={finalSrc}
      alt={name || "User"}
      className={`${className} rounded-full object-cover bg-gray-200 dark:bg-gray-700 border border-gray-100 dark:border-gray-800`}
      onError={() => setError(true)}
    />
  );
};

export default UserAvatar;