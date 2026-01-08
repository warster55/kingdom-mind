'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { WelcomePage } from './WelcomePage';
import { StreamingChat } from '@/components/mentoring/StreamingChat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthStep = 'EMAIL' | 'CODE' | 'WAITLIST';

export function RootChat() {
  const { data: session, status } = useSession();
  const [isEntering, setIsEntering] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle URL Errors
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'WAITLIST_ACTIVE') {
      setAuthStep('WAITLIST');
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
  const emailPrompt = "You are the Gatekeeper of Kingdom Mind. Welcome the user warmly and ask for their email address to begin.";
  const codePrompt = `I have sent a 6-digit sign-in code to \${email}. Kindly ask the user to share the code here to open the gates.`;
  const waitlistPrompt = "The user is not yet on our approved list. Kindly explain that we are currently invite-only to ensure focused care. They have been added to our path of interest.";

  const initialMessages: Message[] = {
    EMAIL: [
      {
        id: 'gatekeeper-1',
        role: 'assistant',
        content: "Peace be with you. You have reached the threshold of the sanctuary. To begin your journey of renewal, may I ask for the email address you wish to use?",
        timestamp: new Date(),
      }
    ],
    CODE: [
      {
        id: 'gatekeeper-code',
        role: 'assistant',
        content: `I have sent a 6-digit sign-in code to your inbox. Please share it with me here to open the gates.`,
        timestamp: new Date(),
      }
    ],
    WAITLIST: [
      {
        id: 'waitlist-1',
        role: 'assistant',
        content: "Peace be with you. I see your heart is ready for this journey, but our sanctuary is currently at capacity to ensure we can provide focused care to every soul. I have recorded your interest, and the gates will open for you as soon as a space is prepared.",
        timestamp: new Date(),
      }
    ]
  }[authStep];

  const handleMessageIntercept = async (content: string) => {
    if (authStep === 'WAITLIST' || isProcessing) return false;

    // STEP 1: Handle Email Submission
    if (authStep === 'EMAIL') {
      const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        const submittedEmail = emailMatch[0].toLowerCase();
        setEmail(submittedEmail);
        setIsProcessing(true);

        try {
          const res = await fetch('/api/auth/otp/request', {
            method: 'POST',
            body: JSON.stringify({ email: submittedEmail }),
          });
          const data = await res.json();

          if (data.error === 'WAITLIST_ACTIVE') {
            setAuthStep('WAITLIST');
          } else if (data.success) {
            setAuthStep('CODE');
          } else {
            // Error handling
            console.error(data.error);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsProcessing(false);
        }
        return true;
      }
    }

    // STEP 2: Handle Code Submission
    if (authStep === 'CODE') {
      const codeMatch = content.match(/\b\d{6}\b/);
      if (codeMatch) {
        const code = codeMatch[0];
        setIsProcessing(true);

        const result = await signIn('credentials', { 
          email, 
          code, 
          redirect: false 
        });

        setIsProcessing(false);

        if (result?.error) {
          // Handle error (invalid code, etc)
          return false; 
        } else {
          router.push('/reflect');
          return true;
        }
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
      
      <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
        <div className="flex-1 relative">
          <StreamingChat 
            key={authStep}
            messages={initialMessages}
            isStreaming={isProcessing}
            error={null}
            insights={[]} 
            habits={[]}
          />
        </div>

        <div className="relative z-[200] pb-8 w-full">
          <ChatInput 
            onSend={(content) => handleMessageIntercept(content)}
            placeholder={authStep === 'EMAIL' ? "Enter your email..." : authStep === 'CODE' ? "Enter the 6-digit code..." : "Join the waitlist..."}
            className="transition-all duration-1000 bg-stone-950/50 backdrop-blur-sm border-stone-800"
          />
        </div>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-sm font-serif italic text-stone-600">
              {authStep === 'EMAIL' ? 'Verifying access...' : 'Opening the gates...'}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}