import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ src, alt = '', className = '', style = {}, placeholder }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;
    if ('loading' in HTMLImageElement.prototype) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={style}>
      {!visible ? (
        placeholder || <div className="w-full h-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
      ) : (
        <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 ease-out transform hover:scale-105" />
      )}
    </div>
  );
};

export default LazyImage;
