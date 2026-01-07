'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { Loader2, Sparkles, Anchor, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Insight, Habit } from '@/lib/db/schema';
import { useQuery } from '@tanstack/react-query';

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
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 40, 
        y: (e.clientY / window.innerHeight - 0.5) * 40 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      DOMAINS.forEach((domain, i) => {
        const count = resonance[domain] || 0;
        const angle = (i / DOMAINS.length) * Math.PI * 2;
        // Zoomed Out Radius: 30% of screen
        const centerX = canvas.width / 2 + Math.cos(angle) * (canvas.width * 0.3);
        const centerY = canvas.height / 2 + Math.sin(angle) * (canvas.height * 0.3);

        for (let j = 0; j < count; j++) {
          const starSeed = j * 1.5 + i;
          const r = (Math.sin(starSeed) * 0.5 + 0.5) * (canvas.width * 0.08);
          const theta = starSeed * 137.5; 
          
          const x = centerX + Math.cos(theta) * r;
          const y = centerY + Math.sin(theta) * r;
          
          ctx.beginPath();
          ctx.arc(x, y, 0.6, 0, Math.PI * 2);
          ctx.fillStyle = domain === activeDomain ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)';
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [resonance, activeDomain]);

  const spatialMessages = useMemo(() => {
    const aiMessages = messages.filter(m => m.role === 'assistant');
    return aiMessages.map((msg, idx) => {
      const age = aiMessages.length - 1 - idx;
      const seed = parseInt(msg.id.slice(-6)) || Math.random() * 1000;
      const angle = (seed % 360) * (Math.PI / 180);
      
      // Increased Space between steps: 20vw initial + 15vw per age
      const driftDist = age === 0 ? 0 : 20 + (age * 15); 
      
      return {
        ...msg,
        x: Math.cos(angle) * driftDist,
        y: Math.sin(angle) * (driftDist * 0.7),
        age
      };
    });
  }, [messages]);

  const starMap = useMemo(() => {
    return insights.map(insight => {
      const domainIndex = DOMAINS.indexOf(insight.domain);
      const angle = (domainIndex / DOMAINS.length) * Math.PI * 2;
      const baseLeft = 50 + Math.cos(angle) * 30; // Zoomed Out
      const baseTop = 50 + Math.sin(angle) * 30; // Zoomed Out
      
      const seed = insight.id * 42;
      const x = baseLeft + (Math.sin(seed) * 8);
      const y = baseTop + (Math.cos(seed) * 8);

      return { ...insight, x, y };
    });
  }, [insights]);

  const constellations = useMemo(() => {
    const groups: Record<string, typeof starMap> = {};
    starMap.forEach(star => {
      if (!groups[star.domain]) groups[star.domain] = [];
      groups[star.domain].push(star);
    });
    return groups;
  }, [starMap]);

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-stone-950">
      
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-40 transition-opacity duration-1000"
        style={{ transform: `translate(${-mousePos.x * 0.1}px, ${-mousePos.y * 0.1}px)` }}
      />

      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {DOMAINS.map((domain, i) => {
          const isActive = activeDomain === domain;
          const angle = (i / DOMAINS.length) * Math.PI * 2;
          const left = 50 + Math.cos(angle) * 30; // Zoomed Out
          const top = 50 + Math.sin(angle) * 30; // Zoomed Out

          return (
            <motion.div
              key={domain}
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 0.15 : 0.03 }}
              style={{ left: `${left}%`, top: `${top}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
            >
              <span className={cn(
                "text-[3vw] font-serif italic uppercase tracking-[1.5em] whitespace-nowrap transition-all duration-1000",
                isActive ? "text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.2)]" : "text-stone-800"
              )}>
                {domain}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none">
        <motion.div style={{ x: mousePos.x * 0.2, y: mousePos.y * 0.2 }} className="w-full h-full relative">
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            {Object.entries(constellations).map(([domain, stars]) => {
              if (stars.length < 2) return null;
              const colorClass = DOMAIN_COLORS[domain]?.split(' ')[3] || "stroke-stone-800/20";
              return (
                <g key={domain}>
                  {stars.map((star, i) => {
                    const next = stars[i+1];
                    if (!next) return null;
                    return (
                      <line 
                        key={`${star.id}-${next.id}`} 
                        x1={`${star.x}%`} y1={`${star.y}%`} 
                        x2={`${next.x}%`} y2={`${next.y}%`} 
                        className={cn("stroke-[0.5] fill-none opacity-30", colorClass)} 
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
          {starMap.map((star) => {
            const style = DOMAIN_COLORS[star.domain] || DOMAIN_COLORS['Mindset'];
            const [, bgCol, shadowCol] = style.split(' ');
            return (
              <div 
                key={star.id} 
                style={{ left: `${star.x}%`, top: `${star.y}%` }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-help"
                onClick={() => setFocusedMessageId(star.id.toString())}
              >
                <div className={cn("w-2 h-2 rounded-full shadow-lg transition-all duration-700 group-hover:scale-150", bgCol, shadowCol)} />
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {spatialMessages.map((msg) => {
            const isLast = msg.age === 0;
            const isCondensed = msg.age > 6;
            const isFocused = focusedMessageId === msg.id;
            
            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isFloating
                position={{ x: `${msg.x}vw`, y: `${msg.y}vh` } as any}
                scale={isLast ? 1 : Math.max(0.3, 0.8 - (msg.age * 0.12))}
                opacity={isLast ? 1 : Math.max(0.05, 0.5 - (msg.age * 0.15))}
                blur={isLast ? 0 : msg.age * 1.5}
                onClick={() => setFocusedMessageId(isFocused ? null : msg.id)}
                contentClassName={cn(
                  "transition-all duration-1000",
                  isLast ? "text-2xl md:text-3xl text-stone-100" : "text-stone-600",
                  focusedMessageId === msg.id && "text-white scale-110 blur-0 opacity-100"
                )}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isStreaming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.03, 0.1, 0.03] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(217,119,6,0.05)_0%,_transparent_70%)] z-0"
          />
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute top-1/2 -translate-y-1/2 text-red-500 font-serif italic text-sm z-50">
          {error}
        </div>
      )}
    </div>
  );
}
