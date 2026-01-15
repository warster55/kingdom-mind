'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  authenticateBiometric,
  getBiometricTypeName,
  isBiometricAvailable,
} from '@/lib/biometric/client';
import {
  getBiometricEnabled,
  getBiometricCredentialId,
  setBiometricEnabled,
} from '@/lib/storage/sanctuary-db';

interface BiometricLockProps {
  onUnlock: () => void;
}

type LockState = 'checking' | 'locked' | 'authenticating' | 'unlocked' | 'disabled';

export function BiometricLock({ onUnlock }: BiometricLockProps) {
  const [state, setState] = useState<LockState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [biometricName, setBiometricName] = useState('Biometric');
  const [attempts, setAttempts] = useState(0);

  // Check if biometric lock is enabled
  useEffect(() => {
    async function checkLock() {
      try {
        const enabled = await getBiometricEnabled();

        if (!enabled) {
          setState('unlocked');
          onUnlock();
          return;
        }

        // Check if WebAuthn is still available
        if (!isBiometricAvailable()) {
          console.warn('[BiometricLock] WebAuthn no longer available, disabling');
          await setBiometricEnabled(false);
          setState('unlocked');
          onUnlock();
          return;
        }

        setBiometricName(getBiometricTypeName());
        setState('locked');
      } catch (err) {
        console.error('[BiometricLock] Check failed:', err);
        setState('unlocked');
        onUnlock();
      }
    }

    checkLock();
  }, [onUnlock]);

  // Attempt authentication
  const authenticate = useCallback(async () => {
    setState('authenticating');
    setError(null);

    try {
      const credentialId = await getBiometricCredentialId();

      if (!credentialId) {
        // No credential stored, disable biometric
        await setBiometricEnabled(false);
        setState('unlocked');
        onUnlock();
        return;
      }

      const success = await authenticateBiometric(credentialId);

      if (success) {
        setState('unlocked');
        onUnlock();
      } else {
        setAttempts(prev => prev + 1);
        setState('locked');
        setError('Authentication cancelled');
      }
    } catch (err) {
      console.error('[BiometricLock] Auth failed:', err);
      setAttempts(prev => prev + 1);
      setState('locked');
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }, [onUnlock]);

  // Auto-prompt on first load
  useEffect(() => {
    if (state === 'locked' && attempts === 0) {
      // Small delay before auto-prompting
      const timer = setTimeout(() => {
        authenticate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, attempts, authenticate]);

  // Disable biometric and continue
  const handleDisable = async () => {
    await setBiometricEnabled(false);
    setState('unlocked');
    onUnlock();
  };

  // Still checking
  if (state === 'checking') {
    return (
      <div className="fixed inset-0 z-[250] bg-stone-950 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-amber-400/60 text-sm"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  // Already unlocked or disabled
  if (state === 'unlocked' || state === 'disabled') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[250] bg-stone-950 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="mb-8"
      >
        <h1 className="flex items-baseline text-amber-500/80 text-xs uppercase tracking-[0.1em] font-black">
          <span>KINGDO</span>
          <span className="text-2xl font-normal text-amber-400 font-script mx-[-1px] transform translate-y-[2px] scale-110">m</span>
          <span className="ml-1">IND</span>
        </h1>
      </motion.div>

      {/* Lock icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mb-6"
      >
        {state === 'authenticating' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full"
          />
        ) : (
          <svg
            className="w-10 h-10 text-amber-400"
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
        )}
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-stone-100 text-center mb-2"
      >
        {state === 'authenticating' ? 'Verifying...' : 'Sanctuary Locked'}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-stone-400 text-sm text-center mb-8 max-w-xs"
      >
        {state === 'authenticating'
          ? `Complete ${biometricName} to continue`
          : `Use ${biometricName} to unlock your sanctuary`}
      </motion.p>

      {/* Error */}
      {error && state === 'locked' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg max-w-xs w-full"
        >
          <p className="text-red-400 text-sm text-center">{error}</p>
        </motion.div>
      )}

      {/* Unlock button */}
      {state === 'locked' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 w-full max-w-xs"
        >
          <button
            onClick={authenticate}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
              />
            </svg>
            Unlock with {biometricName}
          </button>

          {/* After 2 failed attempts, show option to disable */}
          {attempts >= 2 && (
            <button
              onClick={handleDisable}
              className="w-full py-2 px-4 text-stone-500 hover:text-stone-400 text-sm transition-colors"
            >
              Disable biometric lock
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
