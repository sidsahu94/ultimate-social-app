// frontend/src/hooks/useInfiniteScroll.js
import { useEffect, useRef, useCallback } from 'react';

export default function useInfiniteScroll(callback) {
  const observerRef = useRef(null);
  const callbackRef = useRef(callback);
  const targetNodeRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const setRef = useCallback((node) => {
    // Prevent reconnecting and re-evaluating intersection if DOM node has not changed
    if (targetNodeRef.current === node) return;
    targetNodeRef.current = node;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && callbackRef.current) {
          callbackRef.current();
        }
      },
      { rootMargin: '600px' }
    );

    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return setRef;
}
