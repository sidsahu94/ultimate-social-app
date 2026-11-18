// frontend/src/hooks/useInfiniteScroll.js
import { useEffect, useRef, useCallback } from 'react';

export default function useInfiniteScroll(callback) {
  const observerRef = useRef(null);
  const callbackRef = useRef(callback);
  const targetNodeRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 1. IntersectionObserver targeting both inner scroll container and window
  const setRef = useCallback((node) => {
    if (targetNodeRef.current === node) return;
    targetNodeRef.current = node;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    const scrollContainer = typeof document !== 'undefined' 
      ? document.getElementById('main-scroll-container') 
      : null;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && callbackRef.current) {
          callbackRef.current();
        }
      },
      { 
        root: scrollContainer || null,
        rootMargin: '900px' 
      }
    );

    observerRef.current.observe(node);
  }, []);

  // 2. Continuous passive scroll event fallback for guaranteed infinite scrolling across all mobile devices
  useEffect(() => {
    let ticking = false;

    const checkScrollThreshold = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!callbackRef.current) return;

        const container = typeof document !== 'undefined'
          ? (document.getElementById('main-scroll-container') || window)
          : window;

        const isWin = container === window;
        const scrollHeight = isWin
          ? (document.documentElement?.scrollHeight || document.body?.scrollHeight || 0)
          : container.scrollHeight;
        const scrollTop = isWin
          ? (window.scrollY || window.pageYOffset || 0)
          : container.scrollTop;
        const clientHeight = isWin
          ? (window.innerHeight || 0)
          : container.clientHeight;

        if (scrollHeight > 0 && scrollHeight - scrollTop - clientHeight < 900) {
          callbackRef.current();
        }
      });
    };

    const container = typeof document !== 'undefined'
      ? (document.getElementById('main-scroll-container') || window)
      : window;

    container.addEventListener('scroll', checkScrollThreshold, { passive: true });
    if (container !== window) {
      window.addEventListener('scroll', checkScrollThreshold, { passive: true });
    }

    return () => {
      container.removeEventListener('scroll', checkScrollThreshold);
      if (container !== window) {
        window.removeEventListener('scroll', checkScrollThreshold);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return setRef;
}
