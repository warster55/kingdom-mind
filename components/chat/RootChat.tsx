'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { WelcomePage } from './WelcomePage';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function RootChat() {
  const { data: session, status } = useSession();
  const [isEntering, setIsEntering] = useState(false);
  const [waitlistMode, setWaitlistMode] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle Auth Errors from URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'WAITLIST_ACTIVE' || error === 'Callback') {
      setWaitlistMode(true);
      setIsEntering(true);
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600/50" />
      </div>
    );
  }

  if (!isEntering) {
    return <WelcomePage onEnter={() => setIsEntering(true)} />;
  }

  // System Prompts
  const gatekeeperPrompt = "You are the Gatekeeper. Welcome the user and ask for their email to grant entry.";
  const waitlistPrompt = "The user provided an email that is not yet on the approved list. Kindly explain that we are currently invite-only to ensure every soul receives focused care. Tell them they have been added to the path of interest and to watch their inbox.";

  const initialMessages: Message[] = waitlistMode ? [
    {
      id: 'waitlist-1',
      role: 'assistant',
      content: "Peace be with you. I see your heart is ready for this journey, but our sanctuary is currently at capacity to ensure we can provide focused care to every soul. I have recorded your interest, and the gates will open for you as soon as a space is prepared. Watch your inbox for an invitation.",
      timestamp: new Date(),
    }
  ] : [
    {
      id: 'gatekeeper-1',
      role: 'assistant',
      content: "Peace be with you. You have reached the threshold of the sanctuary. To begin your journey of renewal, may I ask for the email address you wish to use?",
      timestamp: new Date(),
    }
  ];

  const handleMessageIntercept = async (content: string) => {
    // If we are already in waitlist mode, just let them chat with the AI
    if (waitlistMode) return false;

    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      const email = emailMatch[0];
      const result = await signIn('credentials', { 
        email: email.toLowerCase(), 
        redirect: false 
      });

      if (result?.error) {
        setWaitlistMode(true);
        return true; 
      } else {
        router.push('/reflect');
        return true;
      }
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
        initialMessages={initialMessages}
        systemPrompt={waitlistMode ? waitlistPrompt : gatekeeperPrompt}
        onReset={() => {
          setWaitlistMode(false);
          setIsEntering(false);
          router.replace('/');
        }}
        onMessageSent={handleMessageIntercept}
      />
    </main>
  );
}
