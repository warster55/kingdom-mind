'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSanctuary } from '@/hooks/useSanctuary';
import { ChatInput } from '@/components/chat/ChatInput';
import { StreamingChat } from '@/components/chat/StreamingChat';
import { type Message } from '@/components/chat/ChatMessage';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { InstallGuide } from '@/components/pwa/InstallGuide';
import { BiometricLock } from '@/components/biometric/BiometricLock';
import { BiometricSetup } from '@/components/biometric/BiometricSetup';
import { getBiometricEnabled } from '@/lib/storage/sanctuary-db';
import { cn } from '@/lib/utils';

export function SanctuaryChat() {
  const {
    isLoading,
    isNewUser,
    display,
    isStreaming,
    sendMessage,
  } = useSanctuary();

  const [messages, setMessages] = useState<Message[]>([]);
  const [vvh, setVvh] = useState('100%');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [sanctuaryStatus, setSanctuaryStatus] = useState<'thinking' | 'waiting' | 'reading'>('reading');

  // Biometric states
  const [isLocked, setIsLocked] = useState(true);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [hasCompletedFirstMessage, setHasCompletedFirstMessage] = useState(false);
  const [biometricSetupDismissed, setBiometricSetupDismissed] = useState(false);

  // Handle visual viewport for mobile keyboards
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const lock = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setVvh(`${height}px`);
      setIsKeyboardOpen(height < window.screen.height * 0.75);
    };

    window.visualViewport.addEventListener('resize', lock);
    lock();

    return () => window.visualViewport?.removeEventListener('resize', lock);
  }, []);

  // Add welcome message for new users
  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      const greeting = isNewUser
        ? "Welcome, traveler. I'm glad you found your way here. This is Kingdom Mind — a sanctuary for reflection, growth, and discovering who you're meant to become. What brings you here today?"
        : "Welcome back. I'm here whenever you're ready to continue our journey. What's on your heart today?";

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [isLoading, isNewUser, messages.length]);

  // Check if we should show biometric setup (after first message for new users)
  useEffect(() => {
    async function checkBiometricSetup() {
      if (hasCompletedFirstMessage && isNewUser && !biometricSetupDismissed) {
        const alreadyEnabled = await getBiometricEnabled();
        if (!alreadyEnabled) {
          // Small delay to let the chat settle
          setTimeout(() => setShowBiometricSetup(true), 1500);
        }
      }
    }
    checkBiometricSetup();
  }, [hasCompletedFirstMessage, isNewUser, biometricSetupDismissed]);

  // Handle biometric unlock
  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  // Handle biometric setup complete
  const handleBiometricSetupComplete = useCallback(() => {
    setShowBiometricSetup(false);
    setBiometricSetupDismissed(true);
  }, []);

  // Handle biometric setup skip
  const handleBiometricSetupSkip = useCallback(() => {
    setShowBiometricSetup(false);
    setBiometricSetupDismissed(true);
  }, []);

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to server
    const result = await sendMessage(content);

    // Add assistant response
    if (result?.response) {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Mark first message as complete (for biometric setup prompt)
      if (!hasCompletedFirstMessage) {
        setHasCompletedFirstMessage(true);
      }
    }
  };

  // Biometric lock screen (shows first, before anything else)
  if (isLocked) {
    return <BiometricLock onUnlock={handleUnlock} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full bg-stone-950 flex items-center justify-center" style={{ height: vvh }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-amber-400/60 text-sm"
        >
          Preparing your sanctuary...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full bg-stone-950" style={{ height: vvh }}>
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-8 z-[150] pointer-events-none flex flex-col items-center">
        <h1 className="flex items-baseline text-amber-500/80 text-[10px] uppercase tracking-[0.1em] font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] mb-3">
          <span>KINGDO</span>
          <span className="text-lg font-normal text-amber-400 font-script mx-[-1px] transform translate-y-[2px] scale-110">m</span>
          <span className="ml-1">IND</span>
        </h1>

        {/* Status beacon */}
        <motion.div
          animate={{
            opacity: sanctuaryStatus === 'reading' ? 0 : [0.2, 0.8, 0.2],
            scale: sanctuaryStatus === 'waiting' ? [1, 1.2, 1] : 1,
            backgroundColor: sanctuaryStatus === 'waiting' ? '#fbbf24' : '#fafaf9'
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full blur-[1px] shadow-[0_0_8px_rgba(251,191,36,0.3)]"
        />

        {/* Stats display */}
        {display && display.totalBreakthroughs > 0 && (
          <div className="mt-3 text-stone-500 text-[10px] tracking-wider">
            {display.totalBreakthroughs} breakthrough{display.totalBreakthroughs !== 1 ? 's' : ''}
          </div>
        )}
      </header>

      {/* Main Chat Area */}
      <div className="flex flex-col h-full w-full relative pt-20">
        <div className="flex-1 relative">
          <StreamingChat
            messages={messages}
            isStreaming={isStreaming}
            error={null}
            insights={[]}
            habits={[]}
            isKeyboardOpen={isKeyboardOpen}
            onStatusChange={setSanctuaryStatus}
            isAuthenticated={false}
          />
        </div>

        {/* Input */}
        <div className={cn(
          "w-full transition-all duration-300 px-4",
          isKeyboardOpen ? "pb-2" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
        )}>
          {!isStreaming && (
            <ChatInput
              onSend={handleSend}
              autoFocus
              placeholder="Speak your heart..."
            />
          )}
        </div>
      </div>

      {/* PWA Install Prompts */}
      <InstallPrompt />
      <InstallGuide />

      {/* Biometric Setup Prompt (for new users after first message) */}
      {showBiometricSetup && (
        <BiometricSetup
          onComplete={handleBiometricSetupComplete}
          onSkip={handleBiometricSetupSkip}
        />
      )}
    </div>
  );
}
