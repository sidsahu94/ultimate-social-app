import React, { useEffect, useRef, useState } from 'react';

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
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      });
    }, { rootMargin: '50px' }); // Lower margin to trigger load closer to view

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const finalSrc = proxiedUrl(src);

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`} style={style} onClick={onClick}>
      {/* Placeholder / Skeleton */}
      {(!loaded) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 animate-pulse">
            {placeholder || <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
        </div>
      )}
      
      {/* Actual Image */}
      {visible && src && (
        <img 
          src={finalSrc} 
          alt={alt} 
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

export default LazyImage;