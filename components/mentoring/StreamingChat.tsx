'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Insight, Habit } from '@/lib/db/schema';

interface StreamingChatProps {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  insights: Insight[];
  habits: Habit[];
  mode?: 'mentor' | 'architect';
}

export function StreamingChat({ 
  messages,
  isStreaming,
  error,
  insights,
  habits,
  mode = 'mentor'
}: StreamingChatProps) {
  const isArchitect = mode === 'architect';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [isPacing, setIsPacing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 1. Detect Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Fetch Resonance
  const { data: status } = useQuery({
    queryKey: ['user-status'],
    queryFn: async () => {
      const res = await fetch('/api/user/status');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const activeDomain = status?.activeDomain || 'Identity';
  const resonance = status?.resonance || {};

  // 3. ONE-WAY FLOW LOGIC (The "No Flicker" Core)
  const lastAiMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];
  // We grab the last user message ONLY if the AI hasn't replied to it yet (for the Echo)
  // Logic: If the last message in the WHOLE list is a User message, show it as Echo.
  // If the last message is Assistant, the User's words have "dissolved".
  const lastMessageIsUser = messages[messages.length - 1]?.role === 'user';
  const userEcho = lastMessageIsUser ? messages[messages.length - 1] : null;

  const fullContent = lastAiMessage?.content || '';

  // 4. PEACEFUL STREAMER
  useEffect(() => {
    if (!fullContent) {
      setDisplayedContent('');
      return;
    }
    // Only pace if it's a "fresh" message compared to what we are showing
    if (displayedContent !== fullContent) {
      // If content changed drastically (new message), reset
      if (!fullContent.startsWith(displayedContent) && displayedContent.length > 0) {
        setDisplayedContent('');
      }
      
      setIsPacing(true);
      const interval = setInterval(() => {
        setDisplayedContent(prev => {
          if (prev.length >= fullContent.length) {
            clearInterval(interval);
            setIsPacing(false);
            return prev;
          }
          return fullContent.slice(0, prev.length + 2); // Speed: 2 chars per 30ms
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [fullContent]);

  // 5. BACKGROUND NEBULA (Lite for Mobile)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particleMultiplier = isMobile ? 0.3 : 1; 

      Object.entries(resonance).forEach(([domain, count], i) => {
        const adjustedCount = Math.floor((count as number) * particleMultiplier);
        const angle = (i / 7) * Math.PI * 2;
        const radiusPercent = isMobile ? 0.25 : 0.3;
        const cx = canvas.width / 2 + Math.cos(angle) * (canvas.width * radiusPercent);
        const cy = canvas.height / 2 + Math.sin(angle) * (canvas.height * radiusPercent);

        for (let j = 0; j < adjustedCount; j++) {
          const s = j * 1.5 + i;
          const r = (Math.sin(s) * 0.5 + 0.5) * (canvas.width * (isMobile ? 0.05 : 0.08));
          const t = s * 137.5;
          const x = cx + Math.cos(t) * r;
          const y = cy + Math.sin(t) * r;
          ctx.beginPath();
          ctx.arc(x, y, isMobile ? 0.8 : 0.6, 0, Math.PI * 2);
          ctx.fillStyle = domain === activeDomain ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
          ctx.fill();
        }
      });
      frame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frame);
  }, [resonance, activeDomain, isMobile]);

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
      
      {/* THE SKY */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* THE NOW (Evaporating Text) */}
      <div className="relative z-30 w-full max-w-2xl px-6 flex flex-col items-center justify-center space-y-8">
        <AnimatePresence mode="wait">
          
          {/* USER ECHO (Only visible while waiting) */}
          {userEcho && (
            <motion.div
              key={`echo-${userEcho.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.4, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 1.5 }}
              className="absolute bottom-20 text-stone-500 font-serif italic text-base md:text-lg text-center w-full px-4 pointer-events-none"
            >
              {userEcho.content}
            </motion.div>
          )}

          {/* AI RESPONSE */}
          {lastAiMessage && (
            <motion.div
              key={`ai-${lastAiMessage.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
              transition={{ duration: 1 }}
              className={cn(
                "w-full text-center font-serif italic pb-12", // Added padding to clear echo
                isMobile ? "text-lg md:text-xl leading-relaxed" : "text-2xl md:text-3xl leading-loose",
                isArchitect ? "text-red-600 font-mono" : "text-stone-100"
              )}
            >
              {displayedContent || fullContent} 
              {/* Fallback to fullContent if pacer hasn't started, ensures no empty flash */}
              {isPacing && <span className="animate-pulse ml-1 opacity-50">_</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* THE PULSE (Visible during streaming OR pacing) */}
      <AnimatePresence>
        {(isStreaming || isPacing) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_60%)] z-0"
          />
        )}
      </AnimatePresence>

      {error && <div className="absolute bottom-32 md:bottom-40 text-red-500 italic text-sm z-50 text-center px-4">{error}</div>}
    </div>
  );
}