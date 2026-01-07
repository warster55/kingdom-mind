'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { ActiveFocusCard } from '@/components/progress/ActiveFocusCard';
import { VaultClient } from '@/app/vault/VaultClient';
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
}

export function ReflectChat({ sessionId, initialMessages, user, insights, habits }: ReflectChatProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mode, setMode] = useState<'mentor' | 'architect'>('mentor');
  const [view, setView] = useState<'chat' | 'map'>('chat');

  const isAdmin = (session?.user as any)?.role === 'admin';

  const handleReset = async () => {
    await fetch(`/api/mentoring/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    router.refresh();
  };

  const handleMessageIntercept = async (content: string) => {
    if (content === '#activate' && isAdmin) {
      setMode('architect');
      return true;
    }
    if ((content === '#exit' || content === '#deactivate') && isAdmin) {
      setMode('mentor');
      return true;
    }
    
    // Switch View Commands
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('show me the map') || lowerContent.includes('show me the vault') || lowerContent.includes('look up')) {
      setView('map');
      // We return false to let the message still go to the AI so it can narrate the transition
      return false; 
    }
    if (lowerContent.includes('back to chat') || lowerContent.includes('talk to me') || lowerContent.includes('go back')) {
      setView('chat');
      return false;
    }

    return false;
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Dynamic Background for Map Mode */}
      <AnimatePresence>
        {view === 'map' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-950 z-0"
          />
        )}
      </AnimatePresence>

      {/* Small Floating Header */}
      <header className="absolute top-0 left-0 p-8 z-50 pointer-events-none">
        <h1 className={cn(
          "text-[10px] uppercase tracking-[0.5em] font-bold transition-colors duration-1000",
          view === 'map' ? "text-stone-700" : "text-stone-300 dark:text-stone-700"
        )}>
          Kingdom Mind
        </h1>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative z-10">
        
        {/* Chat Dimension */}
        <motion.div 
          animate={{ 
            opacity: view === 'chat' ? 1 : 0,
            scale: view === 'chat' ? 1 : 1.05,
            filter: view === 'chat' ? 'blur(0px)' : 'blur(20px)'
          }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "flex-1 flex flex-col h-full",
            view === 'map' ? "pointer-events-none" : "pointer-events-auto"
          )}
        >
          <StreamingChat 
            sessionId={sessionId}
            initialMessages={initialMessages}
            systemPrompt="" // Handled by backend now
            onReset={handleReset}
            onMessageSent={handleMessageIntercept}
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
                onClose={() => setView('chat')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar (Desktop Only) */}
      <AnimatePresence>
        {view === 'chat' && mode === 'mentor' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="z-10"
          >
            <ActiveFocusCard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}