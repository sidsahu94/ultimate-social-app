// frontend/src/hooks/useScrollRestoration.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getScrollContainer, getScrollPosition } from '../utils/scrollUtils';

const scrollPositions = {};

export default function useScrollRestoration(key) {
  const location = useLocation();

  useEffect(() => {
    const container = getScrollContainer();
    if (!container) return;

    if (scrollPositions[key] !== undefined) {
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top: scrollPositions[key], behavior: 'auto' });
      } else {
        container.scrollTop = scrollPositions[key];
      }
    }

    return () => {
      scrollPositions[key] = getScrollPosition();
    };
  }, [key, location.pathname]);
}