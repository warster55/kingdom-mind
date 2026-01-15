'use client';

import React, { useState } from 'react';
import { useOnboarding } from '@/lib/onboarding/context';

export function SeedPhraseDisplay() {
  const { data, completeUnlockSetup } = useOnboarding();
  const [confirmed, setConfirmed] = useState(false);
  const [showWords, setShowWords] = useState(false);

  const words = data.seedPhrase?.split(' ') || [];

  const handleConfirm = () => {
    if (confirmed) {
      completeUnlockSetup();
    }
  };

  return (
    <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
      <div className="flex items-center justify-center gap-2 mb-4 text-amber-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-medium">Write these down now</span>
      </div>

      {/* Blur overlay until revealed */}
      <div className="relative">
        {!showWords && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-800/80 backdrop-blur-sm rounded-lg z-10">
            <button
              onClick={() => setShowWords(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white transition-colors"
            >
              Reveal Words
            </button>
          </div>
        )}

        {/* Word grid */}
        <div className={`grid grid-cols-3 gap-2 p-4 bg-stone-900 rounded-lg ${!showWords ? 'filter blur-md' : ''}`}>
          {words.map((word, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-stone-800 rounded"
            >
              <span className="text-stone-500 text-sm w-5">{index + 1}.</span>
              <span className="font-mono text-stone-100">{word}</span>
            </div>
          ))}
        </div>
      </div>

      {showWords && (
        <>
          <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-300 text-sm">
              <strong>This is your only chance to save these words.</strong> If you lose your authenticator app and don't have these words, you will permanently lose access to your account.
            </p>
          </div>

          <label className="flex items-start gap-3 mt-6 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-stone-300 text-sm">
              I have written down all 24 words in order and stored them safely
            </span>
          </label>

          <button
            onClick={handleConfirm}
            disabled={!confirmed}
            className={`w-full mt-4 px-4 py-3 rounded-lg transition-colors ${
              confirmed
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-stone-700 text-stone-500 cursor-not-allowed'
            }`}
          >
            I've saved my recovery phrase
          </button>
        </>
      )}
    </div>
  );
}
