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

  // 1. Fetch Resonance for Background Stars
  const { data: status } = useQuery({
    queryKey: ['user-status'],
    queryFn: async () => {
      const res = await fetch('/api/user/status');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const resonance = status?.resonance || {};
  const activeDomain = status?.activeDomain || 'Identity';

  // 2. PEACEFUL STREAMING LOGIC
  // Smoothly "condense" words from the latest assistant message
  const lastAiMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];
  const fullContent = lastAiMessage?.content || '';

  useEffect(() => {
    if (!fullContent) {
      setDisplayedContent('');
      return;
    }

    // If it's a new message, start the pacing
    let i = displayedContent.length;
    if (i < fullContent.length) {
      setIsPacing(true);
      const interval = setInterval(() => {
        setDisplayedContent(prev => fullContent.slice(0, prev.length + 3));
        if (displayedContent.length >= fullContent.length) {
          clearInterval(interval);
          setIsPacing(false);
        }
      }, 30); // 30ms for a peaceful human rhythm
      return () => clearInterval(interval);
    }
  }, [fullContent, displayedContent]);

  // 3. BACKGROUND NEBULA
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

      Object.entries(resonance).forEach(([domain, count], i) => {
        const angle = (i / 7) * Math.PI * 2;
        const cx = canvas.width / 2 + Math.cos(angle) * (canvas.width * 0.3);
        const cy = canvas.height / 2 + Math.sin(angle) * (canvas.height * 0.3);

        for (let j = 0; j < (count as number); j++) {
          const s = j * 1.5 + i;
          const r = (Math.sin(s) * 0.5 + 0.5) * (canvas.width * 0.08);
          const t = s * 137.5;
          const x = cx + Math.cos(t) * r;
          const y = cy + Math.sin(t) * r;
          ctx.beginPath();
          ctx.arc(x, y, 0.6, 0, Math.PI * 2);
          ctx.fillStyle = domain === activeDomain ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
          ctx.fill();
        }
      });
      frame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frame);
  }, [resonance, activeDomain]);

  // Only show the LATEST exchange to ensure zero clutter
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
      
      {/* THE SKY */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* THE NOW (Evaporating Text) */}
      <div className="relative z-20 w-full max-w-2xl px-8 flex flex-col items-center justify-center space-y-12">
        <AnimatePresence mode="wait">
          {/* USER ECHO */}
          {lastUserMessage && !isStreaming && (
            <motion.div
              key={`user-${lastUserMessage.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5 }}
              className="text-stone-500 font-serif italic text-lg text-center"
            >
              {lastUserMessage.content}
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
                "w-full text-center text-2xl md:text-3xl font-serif italic",
                isArchitect ? "text-red-600 font-mono" : "text-stone-100"
              )}
            >
              {displayedContent}
              {isPacing && <span className="animate-pulse ml-1 opacity-50">_</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* THE PULSE */}
      <AnimatePresence>
        {(isStreaming || isPacing) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05)_0%,_transparent_70%)] z-0"
          />
        )}
      </AnimatePresence>

      {error && <div className="absolute bottom-40 text-red-500 italic text-sm z-50">{error}</div>}
    </div>
  );
}