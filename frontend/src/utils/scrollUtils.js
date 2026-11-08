// frontend/src/utils/scrollUtils.js

export const getScrollContainer = () => {
  return document.getElementById('main-scroll-container') || window;
};

export const getScrollPosition = () => {
  const el = document.getElementById('main-scroll-container');
  return el ? el.scrollTop : (typeof window !== 'undefined' ? window.scrollY : 0);
};

export const scrollToTop = (smooth = true) => {
  const el = document.getElementById('main-scroll-container');
  if (el) {
    el.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  } else if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }
};
