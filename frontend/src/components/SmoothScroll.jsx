import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export const SmoothScroll = ({ children }) => {
  useEffect(() => {
    // Initialize the premium physics scroll
    const lenis = new Lenis({
      duration: 1.2, // Smooth, deliberate timing
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Cinematic ease-out
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false, // Leave native touch scrolling for mobile
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy(); // Clean up when unmounted
    };
  }, []);

  return <>{children}</>;
};