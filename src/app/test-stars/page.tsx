'use client';

import { useState } from 'react';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { Message } from '@/components/chat/ChatMessage';

export default function StarSandbox() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
    { id: '2', role: 'assistant', content: 'Welcome to the Sanctuary.', timestamp: new Date() }
  ]);

  const triggerBreakthrough = () => {
    const newId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: newId,
      role: 'assistant',
      content: 'You have found a deep truth! [RESONANCE: Identity]',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="h-screen w-screen bg-stone-900 overflow-hidden relative">
      <StreamingChat 
        messages={messages}
        isStreaming={false}
        error={null}
        insights={[]}
        habits={[]}
        isAuthenticated={true}
      />
      
      <button 
        onClick={triggerBreakthrough}
        id="trigger-star"
        className="absolute bottom-10 right-10 z-[100] bg-amber-500 text-black px-4 py-2 rounded-full font-bold shadow-lg hover:bg-amber-400 transition-all"
      >
        🌟 Trigger Breakthrough
      </button>

      <div className="absolute top-10 left-10 z-[100] text-white/50 font-serif italic">
        Visual Sandbox: Star Birth Protocol
      </div>
    </div>
  );
}
