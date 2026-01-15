'use client';

import React, { useState, useEffect } from 'react';
import { useOnboarding } from '@/lib/onboarding/context';
import { startRegistration } from '@simplewebauthn/browser';

type UnlockMethod = 'biometric' | 'pin' | null;

export function QuickUnlockSetup() {
  const { finishOnboarding } = useOnboarding();
  const [selectedMethod, setSelectedMethod] = useState<UnlockMethod>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if WebAuthn/biometric is supported
  useEffect(() => {
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricSupported(available);
        } catch {
          setBiometricSupported(false);
        }
      }
    };
    checkSupport();
  }, []);

  const setupBiometric = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/passkey/register-options', {
        method: 'POST',
      });
      const optionsData = await optionsRes.json();

      if (!optionsData.success) {
        throw new Error(optionsData.error || 'Failed to get options');
      }

      // Start WebAuthn registration
      const credential = await startRegistration(optionsData.options);

      // Verify with server
      const verifyRes = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: credential }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setSuccess(true);
        setTimeout(() => finishOnboarding(), 1500);
      } else {
        throw new Error(verifyData.error || 'Verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometric setup failed');
    } finally {
      setLoading(false);
    }
  };

  const setupPin = async () => {
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/pin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => finishOnboarding(), 1500);
      } else {
        setError(data.error || 'Failed to set PIN');
      }
    } catch {
      setError('Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // User can skip quick unlock and just use TOTP
    finishOnboarding();
  };

  if (success) {
    return (
      <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400">Quick unlock set up successfully!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
      {!selectedMethod ? (
        <div className="space-y-3">
          {biometricSupported && (
            <button
              onClick={() => setSelectedMethod('biometric')}
              className="w-full flex items-center gap-4 px-4 py-4 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-stone-100 font-medium">Use Fingerprint or Face</div>
                <div className="text-stone-400 text-sm">Fastest way to unlock</div>
              </div>
            </button>
          )}

          <button
            onClick={() => setSelectedMethod('pin')}
            className="w-full flex items-center gap-4 px-4 py-4 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-stone-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-stone-100 font-medium">Use a 6-digit PIN</div>
              <div className="text-stone-400 text-sm">Works on all devices</div>
            </div>
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-center py-3 text-stone-500 hover:text-stone-400 transition-colors text-sm"
          >
            Skip for now (use TOTP to unlock)
          </button>
        </div>
      ) : selectedMethod === 'biometric' ? (
        <div className="text-center">
          <p className="text-stone-300 mb-4">
            When prompted, use your fingerprint or face to register.
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={setupBiometric}
            disabled={loading}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Set Up Biometric'}
          </button>
          <button
            onClick={() => setSelectedMethod(null)}
            className="block w-full mt-3 text-stone-500 hover:text-stone-400 text-sm"
          >
            Go back
          </button>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-stone-400 text-sm mb-2">Create a 6-digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 bg-stone-700 rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-400 text-sm mb-2">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm PIN"
                className="w-full px-4 py-3 bg-stone-700 rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={setupPin}
              disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
              className={`w-full px-4 py-3 rounded-lg transition-colors ${
                pin.length === 6 && confirmPin.length === 6 && !loading
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Setting up...' : 'Set PIN'}
            </button>

            <button
              onClick={() => setSelectedMethod(null)}
              className="w-full text-stone-500 hover:text-stone-400 text-sm"
            >
              Go back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
