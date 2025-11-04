import { useEffect } from 'react';

export default function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        document.dispatchEvent(new CustomEvent('openCreatePost'));
      }
      if (e.key === '/') {
        const el = document.querySelector('input[placeholder*="Search"]');
        if (el) { e.preventDefault(); el.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
