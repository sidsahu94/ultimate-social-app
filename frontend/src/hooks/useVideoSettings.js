import { useState, useEffect } from 'react';

// Defined OUTSIDE the hook so it acts as a global singleton for the session
let globalMuted = true; // Default to muted (browser policy friendly)
const listeners = new Set();

export default function useVideoSettings() {
  const [isMuted, setIsMuted] = useState(globalMuted);

  useEffect(() => {
    // Subscribe to changes
    const handler = (state) => setIsMuted(state);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const toggleMute = (forceValue) => {
    const newState = forceValue !== undefined ? forceValue : !globalMuted;
    globalMuted = newState;
    // Broadcast to all active components (e.g., Feed & Reel)
    listeners.forEach(fn => fn(newState));
  };

  return { isMuted, toggleMute };
}