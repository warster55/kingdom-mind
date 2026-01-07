'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
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

    if (content === '#activate' && isAdmin) {
      setMode('architect');
      return;
    }
    if ((content === '#exit' || content === '#deactivate') && isAdmin) {
      setMode('mentor');
      return;
    }
    
    sendMessage(content, mode);
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-stone-950">
      
      {/* GLOBAL HEADER */}
      <header className="absolute top-0 left-0 p-8 z-[150] pointer-events-none">
        <h1 className="text-stone-800 text-[10px] uppercase tracking-[0.5em] font-black opacity-50">
          Kingdom Mind
        </h1>
      </header>

      {/* THE INFINITE HORIZON CANVAS */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        <div className="flex-1 relative">
          <StreamingChat 
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            insights={insights}
            habits={habits}
            currentDomain={user.currentDomain}
            mode={mode}
          />
        </div>

        {/* SIDEBAR OVERLAY: ACTION ANCHORS (Subtle, persistent) */}
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
        <div className="relative z-[200] pb-4">
          <ChatInput 
            onSend={handleSend} 
            placeholder={mode === 'architect' ? "[ ARCHITECT MODE ACTIVE ]" : "Share what's on your heart..."}
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