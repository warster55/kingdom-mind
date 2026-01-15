'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  isPlatformAuthenticatorAvailable,
  registerBiometric,
  getBiometricTypeName,
} from '@/lib/biometric/client';
import {
  setBiometricEnabled,
  getBiometricEnabled,
} from '@/lib/storage/sanctuary-db';

interface BiometricSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function BiometricSetup({ onComplete, onSkip }: BiometricSetupProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricName, setBiometricName] = useState('Biometric');

  useEffect(() => {
    async function checkAvailability() {
      try {
        // Check if already enabled
        const alreadyEnabled = await getBiometricEnabled();
        if (alreadyEnabled) {
          onComplete();
          return;
        }

        // Check if biometric is available
        const available = await isPlatformAuthenticatorAvailable();
        setIsAvailable(available);
        setBiometricName(getBiometricTypeName());
      } catch (err) {
        console.error('[BiometricSetup] Check failed:', err);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAvailability();
  }, [onComplete]);

  const handleEnable = async () => {
    setIsRegistering(true);
    setError(null);

    try {
      const credential = await registerBiometric();

      if (credential) {
        await setBiometricEnabled(true, credential.credentialId);
        onComplete();
      } else {
        // User cancelled
        setError('Setup was cancelled. You can try again or skip for now.');
      }
    } catch (err) {
      console.error('[BiometricSetup] Registration failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up biometric');
    } finally {
      setIsRegistering(false);
    }
  };

  // Still loading
  if (isLoading) {
    return null;
  }

  // Biometric not available on this device
  if (!isAvailable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-stone-950/95 flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-sm w-full bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-800"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-stone-100 text-center mb-2">
            Protect Your Sanctuary
          </h2>

          {/* Description */}
          <p className="text-stone-400 text-sm text-center mb-6">
            Use {biometricName} to keep your journey private. Only you will be able to access your sanctuary.
          </p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleEnable}
              disabled={isRegistering}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-stone-900 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isRegistering ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full"
                  />
                  Setting up...
                </>
              ) : (
                <>
                  Enable {biometricName}
                </>
              )}
            </button>

            <button
              onClick={onSkip}
              disabled={isRegistering}
              className="w-full py-3 px-4 text-stone-400 hover:text-stone-300 font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>

          {/* Privacy note */}
          <p className="mt-4 text-stone-500 text-xs text-center">
            Your biometric data never leaves your device.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
