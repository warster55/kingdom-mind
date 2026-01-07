'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { Loader2, Sparkles, Anchor, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Insight, Habit } from '@/lib/db/schema';

interface SpatialMessage extends Message {
  x: number;
  y: number;
}

interface StreamingChatProps {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  insights: Insight[];
  habits: Habit[];
  currentDomain: string;
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
  currentDomain
}: StreamingChatProps) {
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 30, 
        y: (e.clientY / window.innerHeight - 0.5) * 30 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Spatial Logic: Assign positions to messages
  const spatialMessages = useMemo(() => {
    const aiMessages = messages.filter(m => m.role === 'assistant');
    return aiMessages.map((msg, idx) => {
      const age = aiMessages.length - 1 - idx;
      
      // Deterministic "Star" position based on message ID
      const seed = parseInt(msg.id.slice(-6)) || Math.random() * 1000;
      const angle = (seed % 360) * (Math.PI / 180);
      
      // The older the message, the further it drifts from center
      const drift = age === 0 ? 0 : 25 + (age * 10); 
      
      return {
        ...msg,
        x: Math.cos(angle) * drift,
        y: Math.sin(angle) * drift,
        age
      };
    });
  }, [messages]);

  // Constellation Logic for Major Stars (Insights)
  const starMap = useMemo(() => {
    return insights.map(insight => ({
      ...insight,
      x: (Math.sin(insight.id * 123.456) * 0.5 + 0.5) * 80 + 10,
      y: (Math.cos(insight.id * 789.012) * 0.5 + 0.5) * 80 + 10,
    }));
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
      
      {/* 1. BACKGROUND: CELESTIAL GEOGRAPHY & STARFIELD */}
      <motion.div 
        style={{ x: -mousePos.x * 0.5, y: -mousePos.y * 0.5 }}
        className="absolute inset-0 pointer-events-none opacity-30"
      >
        {/* Ghost Domain Labels */}
        {DOMAINS.map((domain, i) => {
          const isActive = currentDomain === domain;
          const angle = (i / DOMAINS.length) * Math.PI * 2;
          const left = 50 + Math.cos(angle) * 35;
          const top = 50 + Math.sin(angle) * 35;
          return (
            <div key={domain} style={{ left: `${left}%`, top: `${top}%` }} className="absolute -translate-x-1/2 -translate-y-1/2">
              <span className={cn(
                "text-[4vw] font-serif italic uppercase tracking-[1em] whitespace-nowrap transition-all duration-1000",
                isActive ? "text-amber-500/20" : "text-stone-900"
              )}>{domain}</span>
            </div>
          );
        })}
      </motion.div>

      {/* 2. THE CONSTELLATION LAYER (Insights/Breakthroughs) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <motion.div style={{ x: mousePos.x * 0.2, y: mousePos.y * 0.2 }} className="w-full h-full relative">
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            {Object.entries(constellations).map(([domain, stars]) => (
              <g key={domain}>
                {stars.map((star, i) => {
                  const next = stars[i+1];
                  if (!next) return null;
                  return <line key={star.id} x1={`${star.x}%`} y1={`${star.y}%`} x2={`${next.x}%`} y2={`${next.y}%`} className={cn("stroke-[0.5] fill-none", DOMAIN_COLORS[domain]?.split(' ')[3])} />;
                })}
              </g>
            ))}
          </svg>
          {starMap.map((star) => {
            const style = DOMAIN_COLORS[star.domain] || DOMAIN_COLORS['Mindset'];
            return (
              <div key={star.id} style={{ left: `${star.x}%`, top: `${star.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <div className={cn("w-3 h-3 rounded-full shadow-lg", style.split(' ')[1], style.split(' ')[2])} />
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* 3. THE PRESENCE LAYER (Active Conversation & Echoes) */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {spatialMessages.map((msg) => {
            const isLast = msg.age === 0;
            const isCondensed = msg.age > 5;
            const isFocused = focusedMessageId === msg.id;

            // The magical condensation logic
            if (isCondensed && !isFocused) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 1, scale: 0.5 }}
                  animate={{ 
                    opacity: 0.4, 
                    scale: 0.1, 
                    x: msg.x, 
                    y: msg.y,
                    filter: 'blur(2px)'
                  }}
                  className="absolute w-2 h-2 bg-white rounded-full shadow-sm pointer-events-auto cursor-help"
                  onClick={() => setFocusedMessageId(msg.id)}
                />
              );
            }

            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isFloating
                position={{ x: msg.x, y: msg.y }}
                scale={isLast ? 1 : Math.max(0.4, 1 - (msg.age * 0.15))}
                opacity={isLast ? 1 : Math.max(0.1, 0.6 - (msg.age * 0.2))}
                blur={isLast ? 0 : msg.age * 2}
                onClick={() => setFocusedMessageId(isFocused ? null : msg.id)}
                contentClassName={isLast ? "text-3xl text-stone-100" : "text-stone-500"}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* 4. THE SANCTUARY PULSE */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(217,119,6,0.1)_0%,_transparent_70%)] z-0"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
