'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '@/lib/onboarding/context';
import { onboardingFlow } from '@/lib/onboarding/messages';
import { StreamingChat } from '@/components/chat/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { UsernameSelector } from './UsernameSelector';
import { TotpSetup } from './TotpSetup';
import { SeedPhraseDisplay } from './SeedPhraseDisplay';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Three pulsing dots - indicates more messages coming, tap to continue
function PulsingDots() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-stone-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </motion.div>
  );
}

// Circle arrow - indicates ready for user response
function ReadyIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-stone-500 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export function OnboardingChat() {
  const {
    state,
    chooseGuestMode,
    chooseCreateAccount,
  } = useOnboarding();

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const [readyForInput, setReadyForInput] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const processedStatesRef = useRef<Set<string>>(new Set());

  // Get current step from flow based on state
  const currentStep = onboardingFlow.find(step => step.id === state);
  const stepMessages = currentStep?.messages || [];

  // When state changes, reset for new step
  useEffect(() => {
    if (processedStatesRef.current.has(state)) return;

    const step = onboardingFlow.find(s => s.id === state);
    if (!step?.messages) return;

    processedStatesRef.current.add(state);
    setCurrentMessageIndex(0);
    setWaitingForTap(false);
    setReadyForInput(false);
    setShowAction(false);

    // Show first message immediately
    if (step.messages.length > 0) {
      const firstMsg = step.messages[0];
      setMessages(prev => {
        if (prev.some(m => m.id === firstMsg.id)) return prev;
        return [...prev, {
          id: firstMsg.id,
          role: 'assistant' as const,
          content: firstMsg.content,
          timestamp: new Date(),
        }];
      });

      if (step.messages.length > 1) {
        setCurrentMessageIndex(1);
        setWaitingForTap(true);
      } else {
        // Only one message - check if we need input or action
        if (step.choices) {
          setReadyForInput(true);
        }
        if (step.requiresAction) {
          setShowAction(true);
        }
      }
    }
  }, [state]);

  // Handle tap to show next message
  const handleTapToContinue = () => {
    if (!waitingForTap || !currentStep) return;

    const nextMsg = stepMessages[currentMessageIndex];
    if (nextMsg) {
      setMessages(prev => {
        if (prev.some(m => m.id === nextMsg.id)) return prev;
        return [...prev, {
          id: nextMsg.id,
          role: 'assistant' as const,
          content: nextMsg.content,
          timestamp: new Date(),
        }];
      });

      const nextIndex = currentMessageIndex + 1;
      if (nextIndex < stepMessages.length) {
        setCurrentMessageIndex(nextIndex);
      } else {
        // All messages shown
        setWaitingForTap(false);
        if (currentStep.choices) {
          setReadyForInput(true);
        }
        if (currentStep.requiresAction) {
          setShowAction(true);
        }
      }
    }
  };

  // Handle natural text input from user
  const handleUserInput = (content: string) => {
    const lowerContent = content.toLowerCase().trim();

    // Add user message to chat
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user' as const, content, timestamp: new Date() }
    ]);

    setReadyForInput(false);

    // Interpret user intent based on current state
    if (state === 'welcome') {
      // Check if they want to create account or explore
      const wantsAccount =
        lowerContent.includes('account') ||
        lowerContent.includes('create') ||
        lowerContent.includes('sign up') ||
        lowerContent.includes('join') ||
        lowerContent.includes('yes') ||
        lowerContent.includes('ready') ||
        lowerContent.includes('let\'s do it') ||
        lowerContent.includes('sure') ||
        lowerContent.includes('okay') ||
        lowerContent.includes('ok');

      const wantsExplore =
        lowerContent.includes('explore') ||
        lowerContent.includes('look around') ||
        lowerContent.includes('browse') ||
        lowerContent.includes('not yet') ||
        lowerContent.includes('maybe later') ||
        lowerContent.includes('just looking') ||
        lowerContent.includes('no');

      if (wantsExplore) {
        chooseGuestMode();
      } else {
        // Default to account creation for most positive responses
        chooseCreateAccount();
      }
    }
  };

  // Don't render if not in onboarding state
  if (state === 'not_started' || state === 'guest_mode' || state === 'authenticated') {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tap area for progressing through messages */}
      <div
        className="flex-1 relative"
        onClick={waitingForTap ? handleTapToContinue : undefined}
        style={{ cursor: waitingForTap ? 'pointer' : 'default' }}
      >
        <StreamingChat
          messages={messages}
          isStreaming={false}
          error={null}
          insights={[]}
          habits={[]}
          isKeyboardOpen={false}
          onStatusChange={() => {}}
          isAuthenticated={false}
        />

        {/* Pulsing dots - more messages coming */}
        {waitingForTap && <PulsingDots />}

        {/* Circle arrow - ready for user input */}
        {readyForInput && !showAction && <ReadyIndicator />}
      </div>

      {/* Chat input for natural responses */}
      {readyForInput && !showAction && (
        <div className={cn(
          "w-full px-4 pb-[calc(4rem+env(safe-area-inset-bottom))]"
        )}>
          <ChatInput
            onSend={handleUserInput}
            autoFocus
            placeholder="Share your thoughts..."
          />
        </div>
      )}

      {/* Action components (username selector, TOTP setup, etc.) */}
      {showAction && (
        <div className={cn(
          "w-full px-4 pb-[calc(4rem+env(safe-area-inset-bottom))]"
        )}>
          {currentStep?.requiresAction === 'show_usernames' && <UsernameSelector />}
          {currentStep?.requiresAction === 'show_qr' && <TotpSetup />}
          {currentStep?.requiresAction === 'show_seed_phrase' && <SeedPhraseDisplay />}
        </div>
      )}
    </div>
  );
}
