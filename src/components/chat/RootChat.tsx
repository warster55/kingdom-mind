'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { WelcomePage } from './WelcomePage';
import { StreamingChat } from '@/components/chat/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { useRouter } from 'next/navigation';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { DailyBread } from '@/components/chat/DailyBread';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';
import { GuestNudge } from '@/components/onboarding/GuestNudge';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding';

// Inner component that uses onboarding context
function RootChatInner() {
  const { get } = useConfig();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Onboarding state
  const {
    state: onboardingState,
    startOnboarding,
    isGuest,
    incrementGuestMessages,
    triggerAccountCreation,
    finishOnboarding,
  } = useOnboarding();

  // UI State
  const [vvh, setVvh] = useState('100%');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [sanctuaryStatus, setSanctuaryStatus] = useState<'thinking' | 'waiting' | 'reading'>('reading');

  // Guest mode state
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const [isGuestStreaming, setIsGuestStreaming] = useState(false);

  // Login state (for returning users)
  const [loginStep, setLoginStep] = useState<'USERNAME' | 'CODE'>('USERNAME');
  const [loginUsername, setLoginUsername] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Mentor chat for authenticated users
  const mentorChat = useStreamingChat({ sessionId: 0 });

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

  // When user is already authenticated, set onboarding to authenticated state
  useEffect(() => {
    if (status === 'authenticated' && onboardingState !== 'authenticated') {
      finishOnboarding();
    }
  }, [status, onboardingState, finishOnboarding]);

  // Initialize greeting when authenticated
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

  // Guest mode chat handler (no persistence, real AI)
  const handleGuestSend = useCallback(async (content: string) => {
    // Check for account creation trigger
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('create account') ||
        lowerContent.includes('sign up') ||
        lowerContent.includes('make an account')) {
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

  // Login handler for returning users (username + TOTP)
  const handleLoginSend = async (content: string) => {
    setLoginError(null);

    if (loginStep === 'USERNAME') {
      // User entered their username
      const username = content.trim().toLowerCase();
      if (username.length > 0) {
        setLoginUsername(username);
        setLoginStep('CODE');
        return true;
      }
    }

    if (loginStep === 'CODE') {
      // User entered their TOTP code
      const codeMatch = content.match(/\b\d{6}\b/);
      if (codeMatch) {
        setIsProcessingAuth(true);
        try {
          const result = await signIn('username-totp', {
            username: loginUsername,
            code: codeMatch[0],
            redirect: false,
          });

          if (result?.error) {
            setLoginError('Invalid code. Please try again.');
            setIsProcessingAuth(false);
          } else {
            router.refresh();
          }
        } catch (e) {
          console.error('[Auth] Sign In Exception:', e);
          setLoginError('Something went wrong. Please try again.');
          setIsProcessingAuth(false);
        }
        return true;
      }
    }
    return false;
  };

  // Authenticated send handler
  const handleAuthenticatedSend = async (content: string) => {
    if (content === '/logout') {
      signOut();
      return;
    }
    mentorChat.sendMessage(content);
  };

  // Loading state
  if (status === 'loading') return null;

  // === RENDER: Welcome Page (before any interaction) ===
  if (status === 'unauthenticated' && onboardingState === 'not_started') {
    return (
      <div className="fixed inset-0 w-full" style={{ height: vvh }}>
        <WelcomePage onEnter={startOnboarding} />
      </div>
    );
  }

  // === RENDER: Onboarding Flow (welcome, account creation steps) ===
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

  // === RENDER: Guest Mode (exploring without account) ===
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

  // === RENDER: Returning User Login (username + TOTP) ===
  // This shows when user is unauthenticated but somehow got past the welcome page
  // (e.g., session expired, returning to app)
  if (status === 'unauthenticated' && onboardingState === 'authenticated') {
    const loginMessages: Message[] = [{
      id: 'login-prompt',
      role: 'assistant',
      content: loginStep === 'USERNAME'
        ? get('login_username_prompt', "Welcome back, Seeker. Please enter your username to return to your sanctuary.")
        : loginError || get('login_code_prompt', "Now enter the 6-digit code from your authenticator app."),
      timestamp: new Date()
    }];

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
              key={loginStep}
              messages={loginMessages}
              isStreaming={isProcessingAuth}
              error={null}
              insights={[]}
              habits={[]}
              isKeyboardOpen={isKeyboardOpen}
              onStatusChange={setSanctuaryStatus}
              isAuthenticated={false}
            />
          </div>
          <div className={cn(
            "w-full transition-all duration-300 px-4",
            isKeyboardOpen ? "pb-2" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
          )}>
            {!isProcessingAuth && (
              <ChatInput
                onSend={handleLoginSend}
                autoFocus
                placeholder={loginStep === 'USERNAME' ? "Enter your username..." : "Enter 6-digit code..."}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // === RENDER: Authenticated View ===
  if (status === 'authenticated') {
    return (
      <div className="fixed inset-0 w-full bg-stone-950" style={{ height: vvh }}>
        <header className="absolute top-0 left-0 right-0 p-8 z-[150] flex flex-col items-center pointer-events-none">
          <h1 className="flex items-baseline text-amber-500/80 text-[10px] uppercase tracking-[0.1em] font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] mb-3 select-none">
            <span>KINGDO</span>
            <span className="text-lg font-normal text-amber-400 font-script mx-[-1px] transform translate-y-[2px] scale-110">m</span>
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
          <div className={cn(
            "w-full transition-all duration-300 px-4",
            isKeyboardOpen ? "pb-2" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
          )}>
            {!mentorChat.isStreaming && (
              <ChatInput onSend={handleAuthenticatedSend} autoFocus placeholder="Speak your heart..." />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

// Main export wraps inner component with OnboardingProvider
export function RootChat() {
  return (
    <OnboardingProvider>
      <RootChatInner />
    </OnboardingProvider>
  );
}
