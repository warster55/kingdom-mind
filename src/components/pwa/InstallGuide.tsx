'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAppInstalled, isIOS, initInstallPrompt, registerServiceWorker } from '@/lib/pwa/install-prompt';

export function InstallGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initialize PWA
    initInstallPrompt();
    registerServiceWorker();

    // Check if we should show the iOS guide
    const checkGuide = () => {
      if (isAppInstalled() || dismissed) {
        setShowGuide(false);
        return;
      }

      // Show guide for iOS Safari users
      if (isIOS()) {
        // Small delay to not interrupt initial experience
        setTimeout(() => setShowGuide(true), 5000);
      }
    };

    checkGuide();
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowGuide(false);
  };

  return (
    <AnimatePresence>
      {showGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/80 flex items-end justify-center"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-stone-900 rounded-t-2xl p-6 pb-10"
          >
            <h3 className="text-amber-400 text-lg font-medium text-center mb-4">
              Add Kingdom Mind to Home Screen
            </h3>

            <p className="text-stone-400 text-sm text-center mb-6">
              For the best experience, install Kingdom Mind on your device. Your journey stays on your phone.
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-center gap-4 bg-stone-800 rounded-lg p-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-stone-900 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-stone-200 text-sm">
                    Tap the <span className="text-amber-400">Share</span> button
                  </p>
                  <p className="text-stone-500 text-xs">
                    (the square with an arrow at the bottom)
                  </p>
                </div>
                <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 bg-stone-800 rounded-lg p-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-stone-900 font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-stone-200 text-sm">
                    Scroll down and tap
                  </p>
                  <p className="text-amber-400 text-sm font-medium">
                    "Add to Home Screen"
                  </p>
                </div>
                <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 bg-stone-800 rounded-lg p-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-stone-900 font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-stone-200 text-sm">
                    Tap <span className="text-amber-400">"Add"</span> in the top right
                  </p>
                </div>
                <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 px-4 py-3 text-stone-400 text-sm rounded-lg border border-stone-700 hover:bg-stone-800 transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
