// frontend/src/hooks/useInfiniteScroll.js
import { useEffect, useRef } from 'react';

export default function useInfiniteScroll(callback) {
  const observer = useRef();

  const ref = (node) => {
    if (!node) return;
    
    // 1. Disconnect existing observer to avoid duplicates
    if (observer.current) observer.current.disconnect();

    // 2. Create new observer with FRESH callback closure
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback();
      }
    }, { rootMargin: '200px' });

    // 3. Observe
    observer.current.observe(node);
  };

  return ref;
}