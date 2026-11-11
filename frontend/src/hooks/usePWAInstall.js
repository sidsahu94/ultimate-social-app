// frontend/src/hooks/usePWAInstall.js
import { useState, useEffect, useCallback } from 'react';

// Global variable to capture event even before React mounts
let deferredPromptGlobal = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptGlobal = e;
    window.dispatchEvent(new CustomEvent('pwa:ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPromptGlobal = null;
    window.dispatchEvent(new CustomEvent('pwa:installed'));
  });
}

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(deferredPromptGlobal);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (deferredPromptGlobal && !deferredPrompt) {
      setDeferredPrompt(deferredPromptGlobal);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setDeferredPrompt(e);
    };

    const onPwaReady = () => {
      if (deferredPromptGlobal) setDeferredPrompt(deferredPromptGlobal);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      deferredPromptGlobal = null;
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('pwa:ready', onPwaReady);
    window.addEventListener('appinstalled', onAppInstalled);

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('pwa:ready', onPwaReady);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [deferredPrompt]);

  const installApp = useCallback(async () => {
    const promptEvent = deferredPrompt || deferredPromptGlobal;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        deferredPromptGlobal = null;
        return true;
      } catch (err) {
        console.warn('PWA install error:', err);
      }
    }
    return false;
  }, [deferredPrompt]);

  return { 
    isReady: !!(deferredPrompt || deferredPromptGlobal), 
    isInstalled, 
    installApp 
  };
}
