'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { onboardingFlow, OnboardingStep, getRandomNudge } from './messages';

export type OnboardingState =
  | 'not_started'
  | 'welcome'
  | 'guest_intro'
  | 'guest_mode'
  | 'account_username'
  | 'account_totp'
  | 'account_seed'
  | 'account_unlock'
  | 'complete'
  | 'authenticated';

export interface OnboardingData {
  selectedUsername?: string;
  totpQrCode?: string;
  seedPhrase?: string;
  userId?: number;
}

interface OnboardingContextType {
  state: OnboardingState;
  currentStep: OnboardingStep | null;
  data: OnboardingData;
  isGuest: boolean;
  guestMessageCount: number;
  shouldShowNudge: boolean;
  nudgeMessage: string | null;

  // Actions
  startOnboarding: () => void;
  chooseGuestMode: () => void;
  chooseCreateAccount: () => void;
  setUsername: (username: string) => void;
  completeTotpSetup: (qrCode: string) => void;
  completeSeedPhrase: (seedPhrase: string, userId: number) => void;
  completeUnlockSetup: () => void;
  finishOnboarding: () => void;
  incrementGuestMessages: () => void;
  dismissNudge: () => void;
  triggerAccountCreation: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const NUDGE_THRESHOLD = 7; // Show nudge after this many messages

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>('not_started');
  const [data, setData] = useState<OnboardingData>({});
  const [isGuest, setIsGuest] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [shouldShowNudge, setShouldShowNudge] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [hasShownNudge, setHasShownNudge] = useState(false);

  const getCurrentStep = useCallback((): OnboardingStep | null => {
    return onboardingFlow.find(step => step.id === state) || null;
  }, [state]);

  const startOnboarding = useCallback(() => {
    setState('welcome');
  }, []);

  const chooseGuestMode = useCallback(() => {
    setState('guest_intro');
    setIsGuest(true);
    // Transition to guest_mode after intro messages are shown (approx 6 seconds)
    setTimeout(() => setState('guest_mode'), 7000);
  }, []);

  const chooseCreateAccount = useCallback(() => {
    setState('account_username');
    setIsGuest(false);
  }, []);

  const setUsername = useCallback((username: string) => {
    setData(prev => ({ ...prev, selectedUsername: username }));
    setState('account_totp');
  }, []);

  const completeTotpSetup = useCallback((qrCode: string) => {
    setData(prev => ({ ...prev, totpQrCode: qrCode }));
    setState('account_seed');
  }, []);

  const completeSeedPhrase = useCallback((seedPhrase: string, userId: number) => {
    setData(prev => ({ ...prev, seedPhrase, userId }));
    setState('account_unlock');
  }, []);

  const completeUnlockSetup = useCallback(() => {
    setState('complete');
  }, []);

  const finishOnboarding = useCallback(() => {
    setState('authenticated');
  }, []);

  const incrementGuestMessages = useCallback(() => {
    setGuestMessageCount(prev => {
      const newCount = prev + 1;
      // Show nudge after threshold, but only once per session
      if (newCount === NUDGE_THRESHOLD && !hasShownNudge) {
        setShouldShowNudge(true);
        setNudgeMessage(getRandomNudge());
        setHasShownNudge(true);
      }
      return newCount;
    });
  }, [hasShownNudge]);

  const dismissNudge = useCallback(() => {
    setShouldShowNudge(false);
    setNudgeMessage(null);
  }, []);

  const triggerAccountCreation = useCallback(() => {
    // Can be called from anywhere (guest mode, button click, etc.)
    setState('account_username');
    setIsGuest(false);
    setShouldShowNudge(false);
    setNudgeMessage(null);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        currentStep: getCurrentStep(),
        data,
        isGuest,
        guestMessageCount,
        shouldShowNudge,
        nudgeMessage,
        startOnboarding,
        chooseGuestMode,
        chooseCreateAccount,
        setUsername,
        completeTotpSetup,
        completeSeedPhrase,
        completeUnlockSetup,
        finishOnboarding,
        incrementGuestMessages,
        dismissNudge,
        triggerAccountCreation,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
