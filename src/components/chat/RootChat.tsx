'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { WelcomePage } from './WelcomePage';
import { StreamingChat } from '@/components/chat/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArchitectDashboard } from './ArchitectDashboard';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { DailyBread } from '@/components/chat/DailyBread';

export function RootChat() {
  const { get } = useConfig();
  const { data: session, status } = useSession();
  const [startAuthFlow, setStartAuthFlow] = useState(false);
  const [authStep, setAuthStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [showArchitect, setShowArchitect] = useState(false);
  const router = useRouter();
  const [vvh, setVvh] = useState('100%');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const userRole = (session?.user as any)?.role;

  // 1. MENTOR CHAT (Standard)
  const mentorChat = useStreamingChat({ sessionId: 0 });

  // 2. ARCHITECT CHAT (Sovereign)
  const architectChat = useStreamingChat({ sessionId: -1 }); // Special ID or just ignore

  // --- BEACON STATUS ---
  const [sanctuaryStatus, setSanctuaryStatus] = useState<'thinking' | 'waiting' | 'reading'>('reading');

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

  const { data: greeting } = useQuery({
    queryKey: ['greeting', authStep],
    queryFn: async () => {
      const type = authStep === 'CODE' ? 'CODE_REQUEST' : 'LOGIN';
      const res = await fetch(`/api/greetings?type=${type}`);
      return res.json();
    },
    staleTime: 0,
    enabled: status === 'unauthenticated' && startAuthFlow,
  });

  if (status === 'loading') return null;

  if (status === 'unauthenticated' && !startAuthFlow) {
    return (
      <div className="fixed inset-0 w-full" style={{ height: vvh }}>
        <WelcomePage onEnter={() => setStartAuthFlow(true)} />
      </div>
    );
  }

  // AUTHENTICATED VIEW
  if (status === 'authenticated') {
    const handleAuthenticatedSend = async (content: string) => {
      if (content === '/architect' && (userRole === 'architect' || userRole === 'admin')) {
        setShowArchitect(true);
        return;
      }
      if (content === '/logout') {
        signOut();
        return;
      }
      mentorChat.sendMessage(content, 'mentor');
    };

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

  // LOGIN FLOW VIEW (Unauthenticated but startAuthFlow is true)
  const handleAuthSend = async (content: string) => {
    if (authStep === 'EMAIL') {
      const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        setEmail(emailMatch[0].toLowerCase());
        setIsProcessingAuth(true);
        try {
          const res = await fetch('/api/auth/otp/request', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailMatch[0].toLowerCase() }) 
          });
          const data = await res.json();
          if (data.success) setAuthStep('CODE');
        } catch (e) {
          console.error('[Auth] Request Error:', e);
        } finally {
          setIsProcessingAuth(false);
        }
        return true;
      }
    }
    if (authStep === 'CODE') {
      const codeMatch = content.match(/\b\d{6}\b/);
      if (codeMatch) {
        setIsProcessingAuth(true);
        try {
          const result = await signIn('credentials', { email, code: codeMatch[0], redirect: false });
          if (!result?.error) router.refresh();
        } catch (e) {
          console.error('[Auth] Sign In Exception:', e);
        } finally {
          setIsProcessingAuth(false);
        }
        return true;
      }
    }
    return false;
  };

  const loginMessages: Message[] = [{ 
    id: 'gatekeeper', 
    role: 'assistant', 
    content: greeting?.content || (authStep === 'EMAIL' ? get('login_greeting_fallback', "Welcome to the Sanctuary. To begin our journey, may I ask for your email?") : get('code_greeting_fallback', "Please share the code from your inbox.")), 
    timestamp: new Date() 
  }];

  return (
    <div className="fixed inset-0 w-full bg-stone-950" style={{ height: vvh }}>
      <header className="absolute top-0 left-0 right-0 p-8 z-[150] pointer-events-none transition-opacity duration-500 flex flex-col items-center border-none bg-transparent shadow-none">
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
            key={authStep} 
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
            <ChatInput onSend={handleAuthSend} autoFocus placeholder={authStep === 'EMAIL' ? "Enter email..." : "Enter code..."} />
          )}
        </div>
      </div>
    </div>
  );
}