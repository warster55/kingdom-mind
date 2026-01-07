'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { VaultClient } from '@/app/vault/VaultClient';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { User, Insight, Habit } from '@/lib/db/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReflectChatProps {
  sessionId: number;
  initialMessages: Message[];
  user: User;
  insights: Insight[];
  habits: Habit[];
  systemPrompt: string;
}

export function ReflectChat({ sessionId, initialMessages, user, insights, habits, systemPrompt }: ReflectChatProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mode, setMode] = useState<'mentor' | 'architect'>('mentor');
  const [view, setView] = useState<'chat' | 'map'>('chat');
  const [viewportHeight, setViewportHeight] = useState('100svh');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const { messages, isStreaming, error, sendMessage } = useStreamingChat({
    sessionId,
    initialMessages,
    systemPrompt,
  });

  const isAdmin = (session?.user as any)?.role === 'admin';

  // VISUAL VIEWPORT LISTENER (The "Squish" Engine)
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const currentHeight = window.visualViewport.height;
      setViewportHeight(`${currentHeight}px`);
      
      // Heuristic: If height is < 70% of screen height, keyboard is probably open
      setIsKeyboardOpen(currentHeight < window.screen.height * 0.75);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize(); // Init

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const handleReset = async () => {
    await fetch(`/api/mentoring/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    router.refresh();
  };

  const handleSend = async (content: string) => {
    if (content === '/reset') {
      handleReset();
      return;
    }

    if (content === '#activate' && isAdmin) {
      setMode('architect');
      return;
    }
    if ((content === '#exit' || content === '#deactivate') && isAdmin) {
      setMode('mentor');
      return;
    }
    
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('show me the map') || lowerContent.includes('show me the vault') || lowerContent.includes('look up')) {
      setView('map');
    } else if (lowerContent.includes('back to chat') || lowerContent.includes('talk to me') || lowerContent.includes('go back')) {
      setView('chat');
    }

    sendMessage(content, mode);
  };

  return (
    <div 
      className="flex flex-col overflow-hidden relative bg-stone-950 transition-[height] duration-300 ease-out"
      style={{ height: viewportHeight }}
    >
      
      {/* GLOBAL HEADER */}
      <header 
        className={cn(
          "absolute top-0 left-0 p-8 z-[150] pointer-events-none transition-opacity duration-500",
          isKeyboardOpen ? "opacity-0" : "opacity-50" // Hide header when typing to save space
        )}
      >
        <h1 className="text-stone-800 text-[10px] uppercase tracking-[0.5em] font-black">
          Kingdom Mind
        </h1>
      </header>

      {/* THE INFINITE HORIZON CANVAS */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        <div className="flex-1 relative flex flex-col">
          {/* CHAT DIMENSION */}
          <motion.div 
            animate={{ 
              opacity: view === 'chat' ? 1 : 0,
              scale: view === 'chat' ? 1 : 1.1,
              filter: view === 'chat' ? 'blur(0px)' : 'blur(60px)',
              y: view === 'chat' ? 0 : -100
            }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute inset-0 flex flex-col items-center",
              isKeyboardOpen ? "justify-start pt-4" : "justify-center", // Shift text up when keyboard opens
              view === 'map' ? "pointer-events-none" : "pointer-events-auto"
            )}
          >
            <StreamingChat 
              messages={messages}
              isStreaming={isStreaming}
              error={error}
              insights={insights}
              habits={habits}
              currentDomain={user.currentDomain}
              mode={mode}
            />
          </motion.div>

          {/* MAP DIMENSION */}
          <AnimatePresence>
            {view === 'map' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 z-20"
              >
                <VaultClient 
                  user={user} 
                  insights={insights} 
                  habits={habits} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR OVERLAY: ACTION ANCHORS (Desktop only) */}
        <div className="hidden lg:block absolute top-32 right-12 bottom-32 w-64 z-50 pointer-events-none">
          <div className="flex flex-col h-full items-end justify-start space-y-12">
            <div className="text-right">
              <h2 className="text-[10px] uppercase tracking-[0.4em] font-black text-stone-700 mb-6 flex items-center justify-end gap-3">
                <Anchor className="w-3 h-3 opacity-30" /> Action Anchors
              </h2>
              <div className="space-y-6">
                {habits.slice(0, 3).map((habit) => (
                  <div key={habit.id} className="opacity-40 hover:opacity-100 transition-opacity pointer-events-auto cursor-help group">
                    <p className="text-[10px] font-mono text-stone-600 group-hover:text-amber-600 uppercase tracking-widest">{habit.domain} • {habit.streak} DAY STREAK</p>
                    <p className="text-sm font-serif italic text-stone-400 mt-1">{habit.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PERSISTENT SOVEREIGN INPUT */}
        <div 
          className={cn(
            "relative z-[200] w-full transition-all duration-300",
            isKeyboardOpen ? "pb-0" : "pb-8" // Remove padding when keyboard is up
          )}
        >
          <ChatInput 
            onSend={handleSend} 
            placeholder={view === 'map' ? "[ ARCHITECT MODE ACTIVE ]" : "Share what's on your heart..."}
            className={cn(
              "transition-all duration-1000 bg-stone-950/50 backdrop-blur-sm",
              isStreaming ? "border-amber-900/20" : "border-stone-800"
            )}
          />
        </div>
      </div>
    </div>
  );
}
