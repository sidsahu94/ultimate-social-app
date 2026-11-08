// frontend/src/components/ui/UserAvatar.jsx
import React from 'react';
import { getImageUrl } from '../../utils/imageUtils'; 
import { useSocket } from '../../contexts/SocketContext';

const UserAvatar = ({ src, name, userId, className = "w-10 h-10", showStatus = true }) => {
  const { onlineUsers } = useSocket(); 

  const finalSrc = !src 
    ? '/default-avatar.svg' 
    : getImageUrl(src, 'avatar');
  
  const isOnline = userId && onlineUsers.has(userId);

  return (
    <div className="relative inline-block shrink-0">
      <img
        src={finalSrc}
        alt={name || "User"}
        className={`${className} rounded-full object-cover bg-[#04070D] border border-[rgba(226,232,240,0.18)] shadow-sm`}
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = '/default-avatar.svg'; 
        }} 
        loading="lazy"
      />
      
      {/* Online Status Indicator */}
      {showStatus && isOnline && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-[#00F2FE] ring-2 ring-[#04070D] shadow-[0_0_8px_rgba(100,223,223,0.8)]" />
      )}
    </div>
  );
};

export default UserAvatar;
