'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { User, Insight, Habit } from '@/lib/db/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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

  // VISUAL VIEWPORT LISTENER
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const currentHeight = window.visualViewport.height;
      setViewportHeight(`${currentHeight}px`);
      setIsKeyboardOpen(currentHeight < window.screen.height * 0.75);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

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
      
      {/* GLOBAL HEADER (Fades out on keyboard open) */}
      <header 
        className={cn(
          "absolute top-0 left-0 p-8 z-[150] pointer-events-none transition-opacity duration-500",
          isKeyboardOpen ? "opacity-0" : "opacity-30"
        )}
      >
        <h1 className="text-stone-500 text-[10px] uppercase tracking-[0.5em] font-black">
          Kingdom Mind
        </h1>
      </header>

      {/* THE INFINITE HORIZON CANVAS */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        <div className="flex-1 relative flex flex-col min-h-0">
          {/* MAIN CANVAS */}
          <motion.div 
            animate={{ 
              opacity: view === 'chat' ? 1 : 0,
              scale: view === 'chat' ? 1 : 1.1,
              filter: view === 'chat' ? 'blur(0px)' : 'blur(60px)',
              y: view === 'chat' ? 0 : -100
            }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute inset-0 flex flex-col",
              view === 'map' ? "pointer-events-none" : "pointer-events-auto"
            )}
          >
            {/* The Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <StreamingChat 
                messages={messages}
                isStreaming={isStreaming}
                error={error}
                insights={insights}
                habits={habits}
                mode={mode}
              />
            </div>
          </motion.div>
        </div>

        {/* PERSISTENT SOVEREIGN INPUT (Zero UI Mode) */}
        <div 
          className={cn(
            "relative z-[200] w-full transition-all duration-300 pt-12",
            isKeyboardOpen ? "pb-0" : "pb-12"
          )}
        >
          <ChatInput 
            onSend={handleSend} 
            placeholder={view === 'map' ? "[ ARCHITECT MODE ACTIVE ]" : "Share what's on your heart..."}
            className={cn(
              "transition-all duration-1000 bg-transparent border-none shadow-none text-center placeholder:text-stone-700 text-stone-200 text-xl md:text-2xl font-serif italic focus:ring-0",
              isStreaming ? "opacity-30 pointer-events-none" : "opacity-80 hover:opacity-100"
            )}
          />
        </div>
      </div>
    </div>
  );
}
