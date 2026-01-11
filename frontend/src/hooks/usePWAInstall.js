// frontend/src/hooks/usePWAInstall.js
import { useState, useEffect } from 'react';

// 🔥 Global variable to capture event if it fires before React mounts
let deferredPromptGlobal = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPromptGlobal = e;
    console.log("✅ PWA Install Event Captured Globally");
  });
}

export default function usePWAInstall() {
  // Initialize state with the global variable if it already exists
  const [deferredPrompt, setDeferredPrompt] = useState(deferredPromptGlobal);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Handler for the event
    const handler = (e) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setDeferredPrompt(e);
      console.log("✅ PWA Install Event Captured in Hook");
    };

    // If we missed the event (it fired before this component mounted), update state now
    if (deferredPromptGlobal && !deferredPrompt) {
        setDeferredPrompt(deferredPromptGlobal);
    }

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [deferredPrompt]);

  const installApp = async () => {
    if (!deferredPrompt) {
        console.warn("No install prompt available");
        return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    deferredPromptGlobal = null;
  };

  return { isReady: !!deferredPrompt, isInstalled, installApp };
}