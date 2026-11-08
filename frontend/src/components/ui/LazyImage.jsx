// frontend/src/components/ui/LazyImage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FaImage } from 'react-icons/fa';

const ALLOWED_PROXY_HOSTS = ['res.cloudinary.com', 'images.unsplash.com', 'dl.dropboxusercontent.com']; 

function shouldProxy(url) {
  try {
    if (!url) return false;
    const u = new URL(url);
    return ALLOWED_PROXY_HOSTS.some(h => u.host.includes(h));
  } catch (e) { return false; }
}

function proxiedUrl(url) {
  if (!url) return '';
  if (!shouldProxy(url)) return url;
  if (url.startsWith('/api/proxy/image')) return url;
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
}

const LazyImage = ({ src, alt = '', className = '', style = {}, placeholder, onClick = () => {} }) => {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      });
    }, { rootMargin: '100px' });

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const finalSrc = error ? '/fallback-image.png' : proxiedUrl(src);

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-[#070B14] ${className}`} style={style} onClick={onClick}>
      
      {/* Placeholder / Skeleton */}
      {(!loaded && !error) && (
        <div className="absolute inset-0 flex items-center justify-center text-[#CBD5E1]/30 animate-pulse bg-[#0A111E]">
            {placeholder || <FaImage className="opacity-30 text-2xl" />}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070B14] text-[#CBD5E1]/40">
            <FaImage className="mb-1 opacity-50" />
            <span className="text-[10px]">Failed to load</span>
        </div>
      )}
      
      {/* Actual Image */}
      {visible && src && !error && (
        <img 
          src={finalSrc} 
          alt={alt} 
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

export default LazyImage;
