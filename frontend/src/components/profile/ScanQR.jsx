// frontend/src/components/profile/ScanQR.jsx
import React, { useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

export default function ScanQR({ onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#070B14]/95 p-6 shadow-2xl backdrop-blur-2xl text-center animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#CBD5E1]/60 hover:text-white hover:bg-white/10 transition"
          title="Close scanner"
        >
          <FaTimes size={16} />
        </button>

        <h3 className="text-base font-bold text-white mb-4">Scan QR Nametag</h3>

        <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50">
          <QrReader
            constraints={{ facingMode: 'environment' }}
            onResult={(r) => {
              if (r?.text) {
                try {
                  const url = new URL(r.text);
                  if (url.origin === window.location.origin) {
                    navigate(url.pathname);
                  } else {
                    window.location.href = url.href;
                  }
                  if (onClose) onClose();
                } catch {
                  if (r.text.startsWith('/')) {
                    navigate(r.text);
                    if (onClose) onClose();
                  }
                }
              }
            }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
