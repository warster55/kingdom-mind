'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { ActiveFocusCard } from '@/components/progress/ActiveFocusCard';
import { Message } from '@/components/chat/ChatMessage';
import { useRouter } from 'next/navigation';

interface ReflectChatProps {
  sessionId: number;
  initialMessages: Message[];
  systemPrompt: string;
}

export function ReflectChat({ sessionId, initialMessages, systemPrompt }: ReflectChatProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mode, setMode] = useState<'mentor' | 'architect'>('mentor');

  const isAdmin = (session?.user as any)?.role === 'admin';

  const handleReset = async () => {
    await fetch(`/api/mentoring/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    router.refresh();
  };

  const handleMessageSent = async (content: string) => {
    if (!isAdmin) return false;

    if (content === '#activate') {
      setMode('architect');
      return true; // Don't send to API
    }

    if (content === '#exit' || content === '#deactivate') {
      setMode('mentor');
      return true; // Don't send to API
    }

    return false;
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Small Floating Header for Branding */}
      <header className="absolute top-0 left-0 p-8 z-10 pointer-events-none">
        <h1 className="text-stone-300 dark:text-stone-700 text-[10px] uppercase tracking-[0.5em] font-bold animate-fadeIn">
          Kingdom Mind
        </h1>
      </header>

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col h-full transition-colors duration-1000 relative">
        <StreamingChat 
          sessionId={sessionId}
          initialMessages={initialMessages}
          systemPrompt={systemPrompt}
          onReset={handleReset}
          onMessageSent={handleMessageSent}
          mode={mode}
        />
      </div>

      {/* Persistence Sidebar (The Journey) */}
      {mode === 'mentor' && <ActiveFocusCard />}
    </div>
  );
}
