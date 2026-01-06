'use client';

import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { Message } from '@/components/chat/ChatMessage';
import { useRouter } from 'next/navigation';

interface ReflectChatProps {
  sessionId: number;
  initialMessages: Message[];
  systemPrompt: string;
}

export function ReflectChat({ sessionId, initialMessages, systemPrompt }: ReflectChatProps) {
  const router = useRouter();

  const handleReset = async () => {
    // 1. Mark session as completed
    await fetch(`/api/mentoring/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    // 2. Refresh page to get new session
    router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Small Header */}
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-center z-10 pointer-events-none">
        <h1 className="text-stone-300 dark:text-stone-700 text-[10px] uppercase tracking-[0.5em] font-bold">
          Kingdom Mind
        </h1>
      </header>

      <StreamingChat 
        sessionId={sessionId}
        initialMessages={initialMessages}
        systemPrompt={systemPrompt}
        onReset={handleReset}
      />
    </div>
  );
}
