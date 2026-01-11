// frontend/src/components/profile/ScanQR.jsx
import React from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'react-router-dom';

export default function ScanQR(){
  const nav = useNavigate();
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h3 className="text-xl font-semibold mb-3">Scan QR</h3>
      <QrReader
        constraints={{ facingMode: 'environment' }}
        onResult={(r) => {
          if (r?.text) {
            try {
              const url = new URL(r.text);
              window.location.href = url.href;
            } catch {}
          }
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
}
