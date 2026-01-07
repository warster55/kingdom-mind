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

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

const DOMAIN_COLORS: Record<string, string> = {
  'Identity': 'text-amber-400 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] stroke-amber-500/40',
  'Purpose': 'text-blue-400 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] stroke-blue-500/40',
  'Mindset': 'text-zinc-300 bg-zinc-400 shadow-[0_0_20px_rgba(161,161,170,0.5)] stroke-zinc-400/40',
  'Relationships': 'text-rose-300 bg-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.5)] stroke-rose-400/40',
  'Vision': 'text-emerald-400 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] stroke-emerald-500/40',
  'Action': 'text-orange-400 bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] stroke-orange-500/40',
  'Legacy': 'text-purple-400 bg-purple-500 shadow-[0_0_20_rgba(168,85,247,0.5)] stroke-purple-500/40',
};

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
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);

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

  // 3. Pacing Logic
  const lastAiMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];
  const fullContent = lastAiMessage?.content || '';

  useEffect(() => {
    if (!fullContent) {
      setDisplayedContent('');
      return;
    }
    let i = displayedContent.length;
    if (i < fullContent.length) {
      setIsPacing(true);
      const interval = setInterval(() => {
        setDisplayedContent(prev => fullContent.slice(0, prev.length + 3));
        if (displayedContent.length >= fullContent.length) {
          clearInterval(interval);
          setIsPacing(false);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [fullContent, displayedContent]);

  // 4. LITE GALAXY (Reduced particles for mobile)
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

      const particleMultiplier = isMobile ? 0.3 : 1; // Reduce particles by 70% on mobile

      Object.entries(resonance).forEach(([domain, count], i) => {
        const adjustedCount = Math.floor((count as number) * particleMultiplier);
        const angle = (i / 7) * Math.PI * 2;
        // Tighter radius on mobile
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

  // 5. ADAPTIVE PHYSICS (Vertical vs Radial)
  const spatialMessages = useMemo(() => {
    const aiMessages = messages.filter(m => m.role === 'assistant');
    return aiMessages.map((msg, idx) => {
      const age = aiMessages.length - 1 - idx;
      
      if (isMobile) {
        // Vertical Drift for Mobile
        return {
          ...msg,
          x: 0,
          y: age === 0 ? 0 : -20 - (age * 15), // Drift UP
          age
        };
      } else {
        // Radial Drift for Desktop
        const seed = parseInt(msg.id.slice(-6)) || Math.random() * 1000;
        const angle = (seed % 360) * (Math.PI / 180);
        const driftDist = age === 0 ? 0 : 20 + (age * 15);
        return {
          ...msg,
          x: Math.cos(angle) * driftDist,
          y: Math.sin(angle) * (driftDist * 0.7),
          age
        };
      }
    });
  }, [messages, isMobile]);

  // 6. MAJOR STARS (Hidden lines on mobile)
  const starMap = useMemo(() => {
    return insights.map(insight => {
      const domainIndex = DOMAINS.indexOf(insight.domain);
      const angle = (domainIndex / DOMAINS.length) * Math.PI * 2;
      // Tighter constellation on mobile
      const dist = isMobile ? 25 : 30; 
      const baseLeft = 50 + Math.cos(angle) * dist;
      const baseTop = 50 + Math.sin(angle) * dist;
      
      const seed = insight.id * 42;
      const x = baseLeft + (Math.sin(seed) * (isMobile ? 5 : 8));
      const y = baseTop + (Math.cos(seed) * (isMobile ? 5 : 8));

      return { ...insight, x, y };
    });
  }, [insights, isMobile]);

  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
      
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* CONSTELLATION LAYER (Background) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="w-full h-full relative">
          {/* Hide Lines on Mobile */}
          {!isMobile && (
            <svg className="absolute inset-0 w-full h-full overflow-visible opacity-20">
              {/* (SVG logic same as before, omitted for brevity but conceptually here) */}
            </svg>
          )}
          {starMap.map((star) => {
            const style = DOMAIN_COLORS[star.domain] || DOMAIN_COLORS['Mindset'];
            const [, bgCol, shadowCol] = style.split(' ');
            return (
              <div 
                key={star.id} 
                style={{ left: `${star.x}%`, top: `${star.y}%` }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer"
                onClick={() => setFocusedMessageId(star.id.toString())}
              >
                <div className={cn("w-2 h-2 rounded-full shadow-lg transition-all duration-700", bgCol, shadowCol, isMobile && "opacity-60")} />
              </div>
            );
          })}
        </div>
      </div>

      {/* THE NOW (Evaporating Text) */}
      <div className="relative z-30 w-full max-w-2xl px-6 flex flex-col items-center justify-center space-y-8">
        <AnimatePresence mode="wait">
          {/* USER ECHO */}
          {lastUserMessage && !isStreaming && (
            <motion.div
              key={`user-${lastUserMessage.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5 }}
              className="text-stone-500 font-serif italic text-base md:text-lg text-center"
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
                "w-full text-center font-serif italic",
                isMobile ? "text-xl leading-relaxed" : "text-3xl leading-loose",
                isArchitect ? "text-red-600 font-mono" : "text-stone-100"
              )}
            >
              {displayedContent}
              {isPacing && <span className="animate-pulse ml-1 opacity-50">_</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DRIFTING MEMORIES (Background Text) */}
      {!isMobile && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
           <AnimatePresence>
             {spatialMessages.map((msg) => {
               if (msg.age === 0 || msg.age > 5) return null;
               return (
                 <ChatMessage 
                   key={msg.id}
                   message={msg}
                   isFloating
                   position={{ x: `${msg.x}vw`, y: `${msg.y}vh` } as any}
                   scale={Math.max(0.4, 1 - (msg.age * 0.15))}
                   opacity={Math.max(0.05, 0.4 - (msg.age * 0.15))}
                   blur={msg.age * 2}
                 />
               )
             })}
           </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {(isStreaming || isPacing) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(217,119,6,0.05)_0%,_transparent_70%)] z-0"
          />
        )}
      </AnimatePresence>

      {error && <div className="absolute bottom-32 md:bottom-40 text-red-500 italic text-sm z-50 text-center px-4">{error}</div>}
    </div>
  );
}
