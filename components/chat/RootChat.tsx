'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { WelcomePage } from './WelcomePage';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';

export function RootChat() {
  const { data: session, status } = useSession();
  const [isEntering, setIsEntering] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600/50" />
      </div>
    );
  }

  // If already logged in, the parent page will handle the redirect.
  // This component is for the Guest experience.

  if (!isEntering) {
    return <WelcomePage onEnter={() => setIsEntering(true)} />;
  }

  const loginSystemPrompt = "You are the Gatekeeper of Kingdom Mind. Your goal is to welcome the user and ask for their email address to grant them access to the sanctuary. Be warm, poetic, and concise. IF the user shares an email, tell them you are opening the gates.";
  
  const initialLoginMessages: Message[] = [
    {
      id: 'gatekeeper-1',
      role: 'assistant',
      content: "Peace be with you. You have reached the threshold of the sanctuary. To begin your journey of renewal, may I ask for the email address you wish to use?",
      timestamp: new Date(),
    }
  ];

  const handleMessageIntercept = async (content: string) => {
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      const email = emailMatch[0];
      // Trigger the sign-in
      await signIn('credentials', { email, callbackUrl: '/reflect' });
      return true; // We handled it
    }
    return false;
  };

  return (
    <main className="flex flex-col h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-700 overflow-hidden relative">
       <header className="absolute top-0 left-0 right-0 p-8 flex justify-center z-10 pointer-events-none">
        <h1 className="text-stone-300 dark:text-stone-700 text-[10px] uppercase tracking-[0.5em] font-bold">
          Kingdom Mind
        </h1>
      </header>
      
      <StreamingChat 
        sessionId={0}
        initialMessages={initialLoginMessages}
        systemPrompt={loginSystemPrompt}
        onReset={() => setIsEntering(false)}
        onMessageSent={handleMessageIntercept}
      />
    </main>
  );
}