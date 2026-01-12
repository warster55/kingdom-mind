'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { WelcomePage } from './WelcomePage';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function RootChat() {
  const { get } = useConfig();
  const { status } = useSession();
  const [isEntering, setIsEntering] = useState(false);
  const [authStep, setAuthStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const [vvh, setVvh] = useState('100%');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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

  const { data: greeting } = useQuery({
    queryKey: ['greeting', authStep],
    queryFn: async () => {
      const type = authStep === 'CODE' ? 'CODE_REQUEST' : 'LOGIN';
      const res = await fetch(`/api/greetings?type=${type}`);
      return res.json();
    },
    staleTime: 0, 
  });

  if (status === 'loading') return null;

  if (!isEntering) {
    return (
      <div className="fixed inset-0 w-full" style={{ height: vvh }}>
        <WelcomePage onEnter={() => setIsEntering(true)} />
      </div>
    );
  }

  const handleSend = async (content: string) => {
    if (authStep === 'EMAIL') {
      const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        setEmail(emailMatch[0].toLowerCase());
        setIsProcessing(true);
        const res = await fetch('/api/auth/otp/request', { method: 'POST', body: JSON.stringify({ email: emailMatch[0].toLowerCase() }) });
        const data = await res.json();
        setIsProcessing(false);
        if (data.success) {
          setAuthStep('CODE');
        } else {
          // If locked out or error, show it as a system message
          console.error('[Auth] Failed:', data.error);
          // In a real flow, we'd inject an error message into the chat here
        }
        return true;
      }
    }
    if (authStep === 'CODE') {
      const codeMatch = content.match(/\b\d{6}\b/);
      if (codeMatch) {
        setIsProcessing(true);
        const result = await signIn('credentials', { email, code: codeMatch[0], redirect: false });
        setIsProcessing(false);
        if (!result?.error) {
          router.push('/');
          router.refresh(); 
        }
        return true;
      }
    }
    return false;
  };

  const initialMessages: Message[] = [{ 
    id: 'gatekeeper', 
    role: 'assistant', 
    content: greeting?.content || (authStep === 'EMAIL' ? get('login_greeting_fallback', "Welcome to the Sanctuary. To begin our journey, may I ask for your email?") : get('code_greeting_fallback', "Please share the code from your inbox.")), 
    timestamp: new Date() 
  }];

  const appTitle = get('app_title', 'Kingdomind');

  return (
    <div className="fixed inset-0 w-full bg-stone-950" style={{ height: vvh }}>
      
      {/* HEADER: Kingdomind Signature + Persistent Beacon */}
      <header className={cn(
        "absolute top-0 left-0 right-0 p-8 z-[150] pointer-events-none transition-opacity duration-500 flex flex-col items-center",
        "opacity-100" // Always visible
      )}>
        <h1 className="flex items-baseline text-amber-500/80 text-[10px] uppercase tracking-[0.1em] font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] mb-3">
          <span>KINGDO</span>
          <span className="text-lg font-black text-amber-400 ml-[-1px] mr-[0.5px] scale-110 tracking-tighter">M</span>
          <span>IND</span>
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
          <StreamingChat 
            key={authStep} 
            messages={initialMessages} 
            isStreaming={isProcessing} 
            error={null} 
            insights={[]} 
            habits={[]} 
            isKeyboardOpen={isKeyboardOpen}
            onStatusChange={setSanctuaryStatus}
          />
        </div>
        <div className={cn(
          "w-full transition-all duration-300 px-4",
          isKeyboardOpen ? "pb-2" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
        )}>
          {!isProcessing && (
            <ChatInput onSend={handleSend} autoFocus placeholder={authStep === 'EMAIL' ? "Enter email..." : "Enter code..."} />
          )}
        </div>
      </div>
    </div>
  );
}
