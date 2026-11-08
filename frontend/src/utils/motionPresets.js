// File Path: src/frontend/src/utils/motionPresets.js

export const premiumSpringPreset = {
  type: 'spring',
  stiffness: 420,
  damping: 30,
  mass: 0.8
};

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    filter: 'blur(2px)',
    transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] } 
  }
};

export const adaptiveHoverTapFeedback = {
  whileHover: { scale: 1.015, translateY: -2, transition: { duration: 0.2, ease: 'easeOut' } },
  whileTap: { scale: 0.985, translateY: 0 }
};