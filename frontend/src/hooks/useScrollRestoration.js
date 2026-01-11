// frontend/src/hooks/useScrollRestoration.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = {};

export default function useScrollRestoration(key) {
  const location = useLocation();

  useEffect(() => {
    // 1. Restore scroll on mount
    if (scrollPositions[key]) {
      window.scrollTo(0, scrollPositions[key]);
    }

    // 2. Save scroll on unmount (navigation away)
    return () => {
      scrollPositions[key] = window.scrollY;
    };
  }, [key, location.pathname]);
}