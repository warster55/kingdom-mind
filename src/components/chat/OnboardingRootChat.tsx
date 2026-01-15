'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding';
import { OnboardingChat, GuestNudge } from '@/components/onboarding';
import { StreamingChat } from '@/components/chat/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArchitectDashboard } from './ArchitectDashboard';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { DailyBread } from '@/components/chat/DailyBread';

function OnboardingRootChatInner() {
  const { get } = useConfig();
  const { data: session, status } = useSession();
  const {
    state: onboardingState,
    startOnboarding,
    isGuest,
    incrementGuestMessages,
    triggerAccountCreation,
    finishOnboarding,
  } = useOnboarding();

  const [showArchitect, setShowArchitect] = useState(false);
  const [vvh, setVvh] = useState('100%');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const [isGuestStreaming, setIsGuestStreaming] = useState(false);

  const userRole = (session?.user as { role?: string })?.role;

  // Mentor chat for authenticated users
  const mentorChat = useStreamingChat({ sessionId: 0 });

  // Architect chat
  const architectChat = useStreamingChat({ sessionId: -1 });

  const [sanctuaryStatus, setSanctuaryStatus] = useState<'thinking' | 'waiting' | 'reading'>('reading');

  // Handle visual viewport for mobile keyboards
  useEffect(() => {
    if (!window.visualViewport) return;
    const lock = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setVvh(`${height}px`);
      setIsKeyboardOpen(height < window.screen.height * 0.75);
    };
    window.visualViewport.addEventListener('resize', lock);
    lock();
    return () => window.visualViewport?.removeEventListener('resize', lock);
  }, []);

  // Start onboarding for new visitors
  useEffect(() => {
    if (status === 'unauthenticated' && onboardingState === 'not_started') {
      startOnboarding();
    }
  }, [status, onboardingState, startOnboarding]);

  // Set authenticated state when session exists
  useEffect(() => {
    if (status === 'authenticated' && onboardingState !== 'authenticated') {
      finishOnboarding();
    }
  }, [status, onboardingState, finishOnboarding]);

  // Initialize greeting for authenticated users
  useEffect(() => {
    if (status === 'authenticated' && mentorChat.messages.length === 0) {
      mentorChat.setMessages([{
        id: 'initial-greeting',
        role: 'assistant',
        content: get('authenticated_greeting', "Welcome back, Seeker. How may I serve you today?"),
        timestamp: new Date()
      }]);
    }
  }, [status, mentorChat.messages.length, mentorChat.setMessages, get]);

  // Initialize Architect greeting
  useEffect(() => {
    if (showArchitect && architectChat.messages.length === 0) {
      architectChat.setMessages([{
        id: 'arc-init',
        role: 'assistant',
        content: "Architect Protocol Online. Accessing Galaxy...",
        timestamp: new Date()
      }]);
    }
  }, [showArchitect, architectChat.messages.length, architectChat.setMessages]);

  // Guest mode chat handler (no persistence)
  const handleGuestSend = useCallback(async (content: string) => {
    // Check for account creation trigger
    if (content.toLowerCase().includes('create account') ||
        content.toLowerCase().includes('sign up') ||
        content.toLowerCase().includes('make an account')) {
      triggerAccountCreation();
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: `guest-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setGuestMessages(prev => [...prev, userMsg]);
    incrementGuestMessages();
    setIsGuestStreaming(true);

    try {
      // Call the AI directly without session (guest mode)
      const response = await fetch('/api/chat/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: `guest-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || "I'm here to help. What would you like to explore?",
        timestamp: new Date(),
      };
      setGuestMessages(prev => [...prev, assistantMsg]);
    } catch {
      // Fallback response if API fails
      const fallbackMsg: Message = {
        id: `guest-fallback-${Date.now()}`,
        role: 'assistant',
        content: "I sense there's something on your mind. Feel free to share, or if you'd like to save our conversations, you can create an account anytime.",
        timestamp: new Date(),
      };
      setGuestMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsGuestStreaming(false);
    }
  }, [incrementGuestMessages, triggerAccountCreation]);

  // Authenticated send handler
  const handleAuthenticatedSend = async (content: string) => {
    if (content === '/architect' && (userRole === 'architect' || userRole === 'admin')) {
      setShowArchitect(true);
      return;
    }
    if (content === '/logout') {
      // Handle logout
      return;
    }
    mentorChat.sendMessage(content, 'mentor');
  };

  // Loading state
  if (status === 'loading') return null;

  // Onboarding flow (welcome, account creation, etc.)
  if (['welcome', 'guest_intro', 'account_username', 'account_totp', 'account_seed', 'account_unlock', 'complete'].includes(onboardingState)) {
    return (
      <div className="fixed inset-0 w-full bg-stone-950" style={{ height: vvh }}>
        <header className="absolute top-0 left-0 right-0 p-8 z-[150] pointer-events-none flex flex-col items-center">
          <h1 className="flex items-baseline text-amber-500/80 text-[10px] uppercase tracking-[0.1em] font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] mb-3">
            <span>KINGDO</span>
            <span className="text-lg font-normal text-amber-400 font-script mx-[-1px] transform translate-y-[2px] scale-110">m</span>
            <span className="ml-1">IND</span>
          </h1>
          <motion.div
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400 blur-[1px]"
          />
        </header>

        <div className="flex flex-col h-full w-full relative pt-20">
          <OnboardingChat />
        </div>
      </div>
    );
  }

  // Guest mode (exploring without account)
  if (isGuest && onboardingState === 'guest_mode') {
    return (
      <div className="fixed inset-0 w-full bg-stone-950" style={{ height: vvh }}>
        <header className="absolute top-0 left-0 right-0 p-8 z-[150] pointer-events-none flex flex-col items-center">
          <h1 className="flex items-baseline text-amber-500/80 text-[10px] uppercase tracking-[0.1em] font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] mb-3">
            <span>KINGDO</span>
            <span className="text-lg font-normal text-amber-400 font-script mx-[-1px] transform translate-y-[2px] scale-110">m</span>
            <span className="ml-1">IND</span>
          </h1>
          <motion.div
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400 blur-[1px]"
          />
        </header>

        <div className="flex flex-col h-full w-full relative pt-20">
          <div className="flex-1 relative">
            <StreamingChat
              messages={guestMessages}
              isStreaming={isGuestStreaming}
              error={null}
              insights={[]}
              habits={[]}
              isKeyboardOpen={isKeyboardOpen}
              onStatusChange={setSanctuaryStatus}
              isAuthenticated={false}
            />
          </div>

          <GuestNudge />

          <div className={cn(
            "w-full transition-all duration-300 px-4",
            isKeyboardOpen ? "pb-2" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
          )}>
            {!isGuestStreaming && (
              <ChatInput onSend={handleGuestSend} autoFocus placeholder="Speak your heart..." />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated view
  if (status === 'authenticated') {
    return (
      <div className="fixed inset-0 w-full bg-stone-950" style={{ height: vvh }}>
        <AnimatePresence>
          {showArchitect && (
            <ArchitectDashboard
              onExit={() => setShowArchitect(false)}
              messages={architectChat.messages}
              isStreaming={architectChat.isStreaming}
              onSend={(msg) => architectChat.sendMessage(msg, 'architect')}
            />
          )}
        </AnimatePresence>

        <header className={cn(
          "absolute top-0 left-0 right-0 p-8 z-[150] transition-opacity duration-500 flex flex-col items-center pointer-events-none",
          showArchitect ? "opacity-0" : "opacity-100"
        )}>
          <h1 className="flex items-baseline text-amber-500/80 text-[10px] uppercase tracking-[0.1em] font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] mb-3 select-none">
            <span>KINGDO</span>
            <span
              onClick={() => {
                if (userRole === 'architect' || userRole === 'admin') setShowArchitect(true);
              }}
              className={cn(
                "text-lg font-normal text-amber-400 font-script mx-[-1px] transform translate-y-[2px] scale-110",
                (userRole === 'architect' || userRole === 'admin') ? "cursor-pointer hover:text-white transition-colors pointer-events-auto" : ""
              )}
            >m</span>
            <span className="ml-1">IND</span>
          </h1>

          <motion.div
            animate={{
              opacity: sanctuaryStatus === 'reading' ? 0 : [0.2, 0.8, 0.2],
              scale: sanctuaryStatus === 'waiting' ? [1, 1.2, 1] : 1,
              backgroundColor: sanctuaryStatus === 'waiting' ? '#fbbf24' : '#fafaf9'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full blur-[1px] shadow-[0_0_8px_rgba(251,191,36,0.3)]"
          />
        </header>

        <div className="flex flex-col h-full w-full relative pt-20">
          <div className="flex-1 relative">
            <AnimatePresence>
              {mentorChat.messages.length <= 1 && !mentorChat.isStreaming && (
                <DailyBread key="daily-bread" />
              )}
            </AnimatePresence>

            <StreamingChat
              key="main-chat"
              messages={mentorChat.messages}
              isStreaming={mentorChat.isStreaming}
              error={mentorChat.error}
              insights={[]}
              habits={[]}
              isKeyboardOpen={isKeyboardOpen}
              onStatusChange={setSanctuaryStatus}
              isAuthenticated={true}
            />
          </div>
          {!showArchitect && (
            <div className={cn(
              "w-full transition-all duration-300 px-4",
              isKeyboardOpen ? "pb-2" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
            )}>
              {!mentorChat.isStreaming && (
                <ChatInput onSend={handleAuthenticatedSend} autoFocus placeholder="Speak your heart..." />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

export function OnboardingRootChat() {
  return (
    <OnboardingProvider>
      <OnboardingRootChatInner />
    </OnboardingProvider>
  );
}
