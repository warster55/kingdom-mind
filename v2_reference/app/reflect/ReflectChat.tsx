'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { User, Insight, Habit } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { ArchitectDashboard } from '@/components/chat/ArchitectDashboard';

interface ReflectChatProps {
  sessionId: number;
  initialMessages: any[]; // Accept serialized messages (strings dates)
  user: User;
  insights: Insight[];
  habits: Habit[];
  systemPrompt: string;
}

export function ReflectChat({ sessionId, initialMessages, user, insights, habits, systemPrompt }: ReflectChatProps) {
  const { get } = useConfig();
  const router = useRouter();
  const { data: session } = useSession();
  const [mode, setMode] = useState<'mentor' | 'architect'>('mentor');
  const [view, setView] = useState<'chat' | 'map'>('chat');
  const [hasEntered, setHasEntered] = useState(false);
  
  // REVIVE MESSAGES (Date Strings -> Date Objects)
  const revivedMessages = useMemo(() => {
    return initialMessages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp)
    })) as Message[];
  }, [initialMessages]);

  const [sanctuaryStatus, setSanctuaryStatus] = useState<'thinking' | 'waiting' | 'reading'>('reading');

  useEffect(() => {
    if (revivedMessages.length > 0) {
      setHasEntered(true);
    }
  }, [revivedMessages.length]);
  
  const [visualHeight, setVisualHeight] = useState('100%');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const { messages, isStreaming, error, sendMessage } = useStreamingChat({
    sessionId,
    initialMessages: revivedMessages,
    systemPrompt,
  });

  const { data: status } = useQuery({
    queryKey: ['user-status'],
    queryFn: async () => {
      const res = await fetch('/api/user/status');
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 10000,
  });

  const isAdmin = status?.role === 'admin' || status?.role === 'architect' || (session?.user as any)?.role === 'admin' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  const { data: greeting } = useQuery({
    queryKey: ['greeting', 'RETURN_USER'],
    queryFn: async () => {
      const res = await fetch(`/api/greetings?type=RETURN_USER`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 0,
    enabled: !hasEntered && revivedMessages.length === 0,
  });

  const handleResize = useCallback(() => {
    if (!window.visualViewport) return;
    const height = window.visualViewport.height;
    setVisualHeight(`${height}px`);
    setIsKeyboardOpen(height < window.screen.height * 0.75);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;
    window.visualViewport.addEventListener('resize', handleResize);
    handleResize();
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleSend = async (content: string) => {
    if (content === '/reset') {
      await fetch(`/api/mentoring/sessions/${sessionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) });
      router.refresh();
      return;
    }

    if (isAdmin) {
      if (content === '#activate') { setMode('architect'); return; }
      if (content === '#exit' || content === '#deactivate') { setMode('mentor'); return; }
    }
    
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('show me the map') || lowerContent.includes('look up')) setView('map');
    else if (lowerContent.includes('back to chat') || lowerContent.includes('talk to me')) setView('chat');

    sendMessage(content, mode);
  };

  const appTitle = get('app_title', 'Kingdomind');
  const thresholdFallback = get('threshold_greeting_fallback', `Welcome back, ${user?.name?.split(' ')[0] || 'Seeker'}.`);

  return (
    <div className="fixed inset-0 bg-stone-950 overflow-hidden w-full h-[100dvh]" style={{ height: visualHeight }}>
      
      <AnimatePresence>
        {mode === 'architect' && (
          <ArchitectDashboard 
            onExit={() => setMode('mentor')} 
            messages={messages}
            isStreaming={isStreaming}
            onSend={handleSend}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hasEntered && (
          <motion.div 
            key="threshold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            className="absolute inset-0 z-[500] bg-stone-950 flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.h2 animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }} className="text-stone-100 font-serif italic text-2xl mb-12 max-w-lg">
              {greeting?.content?.replace('{name}', user?.name?.split(' ')[0] || 'friend') || thresholdFallback}
            </motion.h2>
            <button
              onClick={() => setHasEntered(true)}
              className="group flex items-center gap-4 px-12 py-5 bg-white dark:bg-stone-900 border border-stone-800 rounded-full text-lg font-medium hover:border-amber-500/50 transition-all duration-700"
            >
              <span className="text-stone-300">Continue Journey</span>
              <ArrowRight className="w-5 h-5 text-amber-600 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER: Kingdomind Signature + Persistent Beacon + Logout */}
      <header className={cn(
        "absolute top-0 left-0 right-0 p-8 z-[150] pointer-events-none transition-opacity duration-500 flex flex-col items-center",
        !hasEntered || mode === 'architect' ? "opacity-0" : "opacity-100"
      )}>
        {/* LOGOUT BUTTON */}
        <div className="absolute right-6 top-6 pointer-events-auto">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-2 text-stone-600 hover:text-amber-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <h1 className="flex items-baseline text-amber-500/80 text-[10px] uppercase tracking-[0.1em] font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] mb-3">
          <span>KINGDO</span>
          <span className="text-2xl font-normal text-amber-400 font-script ml-[-2px] mr-[-1px] transform translate-y-[2px]">m</span>
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

      <div className="flex flex-col relative z-10 w-full h-full">
        <div className="flex-1 relative flex flex-col min-h-0">
          <motion.div 
            animate={{ 
              opacity: view === 'chat' && hasEntered && mode !== 'architect' ? 1 : 0,
              scale: view === 'chat' ? 1 : 1.1,
              filter: mode === 'architect' ? 'blur(60px)' : 'blur(0px)',
              y: view === 'chat' ? 0 : -100
            }}
            transition={{ duration: 2 }}
            className={cn("absolute inset-0 flex flex-col", (view === 'map' || mode === 'architect') ? "pointer-events-none" : "pointer-events-auto")}
          >
            <div className="flex-1 relative">
              <StreamingChat 
                messages={messages} 
                isStreaming={isStreaming} 
                error={error} 
                insights={insights} 
                habits={habits} 
                mode={mode} 
                isKeyboardOpen={isKeyboardOpen} 
                onStatusChange={setSanctuaryStatus}
              />
            </div>
          </motion.div>
        </div>

        <div className={cn(
          "relative z-[200] w-full transition-all duration-300 px-4",
          mode === 'architect' ? "opacity-0 pointer-events-none translate-y-20" : "opacity-100",
          isKeyboardOpen ? "pb-2" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"
        )}>
          <ChatInput onSend={handleSend} autoFocus={hasEntered} placeholder="Speak..." />
        </div>
      </div>
    </div>
  );
}