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

  // If we are authenticated, the app/page.tsx will have redirected us to /reflect
  // but as a fallback, we show a loader here.
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600/50" />
      </div>
    );
  }

  const handleEnterSanctuary = () => {
    setIsEntering(true);
  };

  if (!isEntering && !session) {
    return <WelcomePage onEnter={handleEnterSanctuary} />;
  }

  // Conversational Login State
  const loginSystemPrompt = "You are the Gatekeeper of Kingdom Mind. Your goal is to welcome the user and ask for their email address to grant them access to the sanctuary. Be warm, poetic, and concise.";
  
  const initialLoginMessages: Message[] = [
    {
      id: 'gatekeeper-1',
      role: 'assistant',
      content: "Peace be with you. You have reached the threshold of the sanctuary. To begin your journey of renewal, may I ask for the email address you wish to use?",
      timestamp: new Date(),
    }
  ];

  const handleLoginChat = async (content: string) => {
    // Simple regex to check if the user sent an email
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    
    if (emailMatch) {
      const email = emailMatch[0];
      // Perform the sign-in. This will trigger the redirect to /reflect on success.
      await signIn('credentials', { email, callbackUrl: '/reflect' });
    } else {
      // If not an email, let the AI respond normally or ask again (handled by StreamingChat)
      return false; 
    }
  };

  return (
    <main className="flex flex-col h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-700 overflow-hidden">
       <header className="absolute top-0 left-0 right-0 p-8 flex justify-center z-10 pointer-events-none">
        <h1 className="text-stone-300 dark:text-stone-700 text-[10px] uppercase tracking-[0.5em] font-bold">
          Kingdom Mind
        </h1>
      </header>
      
      <StreamingChat 
        sessionId={0} // 0 indicates a login session
        initialMessages={initialLoginMessages}
        systemPrompt={loginSystemPrompt}
        onReset={() => setIsEntering(false)}
      />
    </main>
  );
}
