import React, { useEffect } from "react";

const Lightbox = ({ images = [], open = false, index = 0, onClose = () => {} }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") document.dispatchEvent(new CustomEvent('lightboxNext'));
      if (e.key === "ArrowLeft") document.dispatchEvent(new CustomEvent('lightboxPrev'));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative max-w-4xl w-full">
        <img src={images[index]} alt={`img-${index}`} className="w-full h-[70vh] object-contain rounded" />
        <button aria-label="Close" className="absolute top-3 right-3 text-white" onClick={onClose}>✕</button>
      </div>
    </div>
  );
};

export default Lightbox;
