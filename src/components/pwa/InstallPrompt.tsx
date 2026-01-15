'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAppInstalled, isAndroid, canShowInstallPrompt, showInstallPrompt, initInstallPrompt, registerServiceWorker } from '@/lib/pwa/install-prompt';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initialize PWA
    initInstallPrompt();
    registerServiceWorker();

    // Check if we should show the prompt
    const checkPrompt = () => {
      if (isAppInstalled() || dismissed) {
        setShowPrompt(false);
        return;
      }

      if (isAndroid() && canShowInstallPrompt()) {
        setShowPrompt(true);
      }
    };

    // Listen for install availability
    const handleInstallAvailable = () => checkPrompt();
    const handleInstalled = () => setShowPrompt(false);

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Initial check after a short delay
    setTimeout(checkPrompt, 2000);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 z-[200] bg-stone-900 border border-stone-700 rounded-xl p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-amber-400 font-medium mb-1">Install Kingdom Mind</h3>
              <p className="text-stone-400 text-sm">
                Add to your home screen for the best experience. Your journey stays on your device.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 text-stone-400 text-sm rounded-lg border border-stone-700 hover:bg-stone-800 transition-colors"
            >
              Maybe later
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 bg-amber-500 text-stone-900 text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
            >
              Install
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
