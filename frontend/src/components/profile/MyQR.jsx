// frontend/src/components/profile/MyQR.jsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSelector } from 'react-redux';

export default function MyQR(){
  const user = useSelector(s=>s.auth.user);
  if (!user) return <div className="p-6 text-center">Login first</div>;
  const profileUrl = `${window.location.origin}/profile/${user._id}`;
  return (
    <div className="p-6 text-center">
      <h3 className="text-xl font-semibold mb-2">My QR Code</h3>
      <div className="inline-block bg-white p-4 rounded shadow">
        <QRCodeSVG value={profileUrl} size={220} />
      </div>
      <div className="mt-3 text-sm text-gray-500">{profileUrl}</div>
    </div>
  );
}
