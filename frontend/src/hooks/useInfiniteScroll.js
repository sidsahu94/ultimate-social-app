// frontend/src/hooks/useInfiniteScroll.js
import { useEffect, useRef } from 'react';

export default function useInfiniteScroll(callback, deps = []) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) callback();
      });
    }, { rootMargin: '200px' });

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
