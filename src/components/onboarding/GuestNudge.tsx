'use client';

import React from 'react';
import { useOnboarding } from '@/lib/onboarding';

export function GuestNudge() {
  const { shouldShowNudge, nudgeMessage, dismissNudge, triggerAccountCreation } = useOnboarding();

  if (!shouldShowNudge || !nudgeMessage) {
    return null;
  }

  return (
    <div className="bg-stone-800/90 backdrop-blur-sm rounded-2xl px-4 py-3 mx-4 mb-4 border border-stone-700">
      <p className="text-stone-200 text-sm mb-3">{nudgeMessage}</p>
      <div className="flex gap-2">
        <button
          onClick={triggerAccountCreation}
          className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm transition-colors"
        >
          Create Account
        </button>
        <button
          onClick={dismissNudge}
          className="px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-stone-300 text-sm transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
