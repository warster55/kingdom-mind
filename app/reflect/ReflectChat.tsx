'use client';

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

  const handleReset = async () => {
    await fetch(`/api/mentoring/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    router.refresh();
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
      <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-stone-950 transition-colors duration-700 relative">
        <StreamingChat 
          sessionId={sessionId}
          initialMessages={initialMessages}
          systemPrompt={systemPrompt}
          onReset={handleReset}
        />
      </div>

      {/* Persistence Sidebar (The Journey) */}
      <ActiveFocusCard />
    </div>
  );
}