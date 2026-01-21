// frontend/src/components/ui/UserAvatar.jsx
import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils'; 
import { useSocket } from '../../contexts/SocketContext';

const UserAvatar = ({ src, name, userId, className = "w-10 h-10", showStatus = true }) => {
  const [error, setError] = useState(false);
  const { onlineUsers } = useSocket(); 

  // 🔥 FIX: Logic to determine final image source
  // 1. If error occurred previously, show default.
  // 2. If src is missing/null/undefined, show default.
  // 3. Otherwise, try to optimize the URL via getImageUrl helper.
  const finalSrc = error || !src 
    ? '/default-avatar.png' 
    : getImageUrl(src, 'avatar');
  
  // Check online status if userId is provided
  const isOnline = userId && onlineUsers.has(userId);

  return (
    <div className="relative inline-block">
      <img
        src={finalSrc}
        alt={name || "User"}
        className={`${className} rounded-full object-cover bg-gray-200 dark:bg-gray-700 border border-gray-100 dark:border-gray-800`}
        onError={() => setError(true)}
        loading="lazy"
      />
      
      {/* Online Status Indicator */}
      {showStatus && isOnline && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900 shadow-sm" />
      )}
    </div>
  );
};

export default UserAvatar;