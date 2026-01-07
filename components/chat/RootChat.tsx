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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
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
  const gatekeeperPrompt = "You are the Gatekeeper of Kingdom Mind. Welcome the user warmly and ask for their email address to begin. If they provide an email, you will verify their access.";
  const waitlistPrompt = "The user provided an email that is NOT approved. Explain poetically that we are at capacity to ensure focused care. Mention they are on the path of interest.";

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
    if (waitlistMode) return false;

    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      const email = emailMatch[0];
      setIsAuthenticating(true);
      
      const result = await signIn('credentials', { 
        email: email.toLowerCase(), 
        redirect: false 
      });

      setIsAuthenticating(false);

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
        key={waitlistMode ? 'waitlist' : 'gatekeeper'}
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

      {isAuthenticating && (
        <div className="absolute inset-0 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-sm font-serif italic text-stone-600">Opening the gates...</p>
          </div>
        </div>
      )}
    </main>
  );
}
