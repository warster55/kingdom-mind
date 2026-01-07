'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { VaultClient } from '@/app/vault/VaultClient';
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

  const { messages, isStreaming, error, sendMessage } = useStreamingChat({
    sessionId,
    initialMessages,
    systemPrompt,
  });

  const isAdmin = (session?.user as any)?.role === 'admin';

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

    // Admin Commands
    if (content === '#activate' && isAdmin) {
      setMode('architect');
      return;
    }
    if ((content === '#exit' || content === '#deactivate') && isAdmin) {
      setMode('mentor');
      return;
    }
    
    // Switch View Commands
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('show me the map') || lowerContent.includes('show me the vault') || lowerContent.includes('look up')) {
      setView('map');
    } else if (lowerContent.includes('back to chat') || lowerContent.includes('talk to me') || lowerContent.includes('go back')) {
      setView('chat');
    }

    sendMessage(content, mode);
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Background Layer */}
      <div className={cn(
        "absolute inset-0 transition-colors duration-1000 z-0",
        view === 'map' ? "bg-stone-950" : "bg-stone-50 dark:bg-stone-950"
      )} />

      {/* Floating Header */}
      <header className="absolute top-0 left-0 p-8 z-50 pointer-events-none">
        <h1 className={cn(
          "text-[10px] uppercase tracking-[0.5em] font-bold transition-colors duration-1000",
          view === 'map' ? "text-stone-700" : "text-stone-300 dark:text-stone-700"
        )}>
          Kingdom Mind
        </h1>
      </header>

      {/* Primary Interaction Layer */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* Dimension Canvas */}
        <div className="flex-1 relative">
          {/* Chat Dimension (Non-Scrolling, Auto-Scaling) */}
          <motion.div 
            animate={{ 
              opacity: view === 'chat' ? 1 : 0,
              scale: view === 'chat' ? 1 : 1.05,
              filter: view === 'chat' ? 'blur(0px)' : 'blur(40px)'
            }}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center",
              view === 'map' ? "pointer-events-none" : "pointer-events-auto"
            )}
          >
            <StreamingChat 
              messages={messages}
              isStreaming={isStreaming}
              error={error}
              mode={mode}
            />
          </motion.div>

          {/* Map Dimension */}
          <AnimatePresence>
            {view === 'map' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
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

        {/* Global Persistent Input (Always on top) */}
        <div className="relative z-[100]">
          <ChatInput 
            onSend={handleSend} 
            placeholder={view === 'map' ? "[ ARCHITECT MODE ] Talk to the system..." : undefined}
            className={cn(
              "transition-all duration-1000",
              view === 'map' && "opacity-40 hover:opacity-100 focus-within:opacity-100 font-mono text-stone-400 border-stone-800"
            )}
          />
        </div>
      </div>
    </div>
  );
}