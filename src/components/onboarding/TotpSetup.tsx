'use client';

import React, { useState, useEffect } from 'react';
import { useOnboarding } from '@/lib/onboarding/context';

export function TotpSetup() {
  const { data, completeTotpSetup, completeSeedPhrase } = useOnboarding();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const register = async () => {
      if (!data.selectedUsername) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: data.selectedUsername }),
        });

        const result = await res.json();

        if (result.success) {
          setQrCode(result.totp.qrCode);
          setSeedPhrase(result.seedPhrase.words);
          // Store for later steps
          completeTotpSetup(result.totp.qrCode);
          // Pre-store seed phrase data
          completeSeedPhrase(result.seedPhrase.words, result.userId);
        } else {
          setError(result.error || 'Registration failed');
        }
      } catch {
        setError('Failed to connect. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    register();
  }, [data.selectedUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async () => {
    if (verificationCode.length !== 6) return;

    setVerifying(true);
    try {
      const res = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const result = await res.json();

      if (result.success) {
        setVerified(true);
      } else {
        setError(result.error || 'Invalid code. Try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
        <div className="flex items-center justify-center gap-2 text-stone-400">
          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
          Setting up your account...
        </div>
      </div>
    );
  }

  if (error && !qrCode) {
    return (
      <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
      {qrCode && (
        <div className="flex flex-col items-center">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl mb-4">
            <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
          </div>

          <p className="text-stone-400 text-sm text-center mb-6">
            Scan with Google Authenticator, Authy, or any TOTP app
          </p>

          {!verified ? (
            <>
              {/* Verification input */}
              <div className="w-full max-w-xs">
                <label className="block text-stone-400 text-sm mb-2">
                  Enter the 6-digit code from your app:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-stone-700 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

              <button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || verifying}
                className={`mt-4 px-6 py-2 rounded-lg transition-colors ${
                  verificationCode.length === 6 && !verifying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                }`}
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="text-green-400 text-lg mb-2">Verified!</div>
              <p className="text-stone-400 text-sm">
                Your authenticator is connected. Scroll down to see your recovery phrase.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
