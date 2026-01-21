// frontend/src/hooks/usePWAInstall.js
import { useState, useEffect } from 'react';

// 🔥 Global variable to capture event if it fires before React mounts
let deferredPromptGlobal = null;

// Only add listener once at the window level
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPromptGlobal = e;
  });
}

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(deferredPromptGlobal);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // If the event captured globally is available and we haven't set state yet
    if (deferredPromptGlobal && !deferredPrompt) {
        setDeferredPrompt(deferredPromptGlobal);
    }

    const handler = (e) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
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
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    // We've used the prompt, and can't use it again, clear it
    setDeferredPrompt(null);
    deferredPromptGlobal = null;
  };

  return { isReady: !!deferredPrompt, isInstalled, installApp };
}