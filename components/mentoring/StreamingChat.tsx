'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
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

// FIXED GALACTIC COORDINATES (0-100 scale) - Cleared Center
const DOMAIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'Identity': { x: 15, y: 20 },
  'Purpose': { x: 85, y: 20 },
  'Mindset': { x: 10, y: 50 },
  'Relationships': { x: 50, y: 85 }, // Moved to bottom center
  'Vision': { x: 90, y: 50 },
  'Action': { x: 20, y: 80 },
  'Legacy': { x: 80, y: 80 },
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

  // 2. Fetch Resonance & Curriculum
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
  const curriculumProgress = status?.curriculum || [];

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

  // 4. ORGANIC COSMOS RENDERER (Gaussian Nebula)
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

      Object.entries(resonance).forEach(([domain, count]) => {
        const adjustedCount = Math.floor((count as number) * particleMultiplier);
        const pos = DOMAIN_POSITIONS[domain] || { x: 50, y: 50 };
        
        const cx = (pos.x / 100) * canvas.width;
        const cy = (pos.y / 100) * canvas.height;

        for (let j = 0; j < adjustedCount; j++) {
          // Gaussian Distribution for Organic Cluster
          const s = j * 1.5; // Seed
          const u = Math.random();
          const v = Math.random();
          // Box-Muller transform for normal distribution
          const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
          
          // Spread factor: Mobile is tighter
          const spread = isMobile ? canvas.width * 0.05 : canvas.width * 0.08;
          const r = Math.abs(z) * spread; // Distance from center
          const theta = Math.random() * 2 * Math.PI; // Random angle
          
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);
          
          ctx.beginPath();
          ctx.arc(x, y, isMobile ? 0.8 : 0.6, 0, Math.PI * 2);
          ctx.fillStyle = domain === activeDomain ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)';
          ctx.fill();
        }
      });
      frame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frame);
  }, [resonance, activeDomain, isMobile]);

  // 5. ADAPTIVE PHYSICS (Vertical Smoke)
  const spatialMessages = useMemo(() => {
    const aiMessages = messages.filter(m => m.role === 'assistant');
    return aiMessages.map((msg, idx) => {
      const age = aiMessages.length - 1 - idx;
      
      if (isMobile) {
        return {
          ...msg,
          x: 0,
          y: age === 0 ? 0 : -20 - (age * 15),
          age
        };
      } else {
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

  // 6. PLANETARY SYSTEM (Pillars)
  const spiralMap = useMemo(() => {
    const allPillars: any[] = [];
    DOMAINS.forEach((domain) => {
      const pos = DOMAIN_POSITIONS[domain] || { x: 50, y: 50 };
      
      // Create 3 pillars per domain orbiting the center
      for (let order = 1; order <= 3; order++) {
        const prog = curriculumProgress.find((p: any) => p.domain === domain && p.order === order);
        const status = prog ? prog.status : 'locked';
        
        // Arrange pillars in a random but stable triangle around the domain center
        const seed = domain.charCodeAt(0) + order; 
        const offsetAngle = (seed * 137.5) * (Math.PI / 180); 
        const dist = 5; // Orbit distance (percentage)
        
        const x = pos.x + Math.cos(offsetAngle) * dist;
        const y = pos.y + Math.sin(offsetAngle) * dist;

        allPillars.push({ 
          id: `${domain}-${order}`,
          domain, 
          status, 
          x, 
          y, 
          name: prog?.pillarName || `Pillar ${order}` 
        });
      }
    });
    return allPillars;
  }, [curriculumProgress]);

  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
      
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* DOMAIN LABELS (The Suns) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {DOMAINS.map((domain) => {
          const isActive = activeDomain === domain;
          const pos = DOMAIN_POSITIONS[domain];

          return (
            <motion.div
              key={domain}
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 0.8 : 0.3 }}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group pointer-events-auto cursor-help"
            >
              <span className={cn(
                "font-serif italic uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-1000",
                isMobile ? "text-xs" : "text-sm",
                isActive ? "text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "text-stone-600 group-hover:text-stone-400"
              )}>
                {domain}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* PLANETARY LAYER (Pillars) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="w-full h-full relative">
          {spiralMap.map((pillar) => {
            const style = DOMAIN_COLORS[pillar.domain] || DOMAIN_COLORS['Mindset'];
            const [, bgCol, shadowCol] = style.split(' ');
            const isCompleted = pillar.status === 'completed';
            const isActive = pillar.status === 'active';
            
            return (
              <div 
                key={pillar.id} 
                style={{ left: `${pillar.x}%`, top: `${pillar.y}%` }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-help"
                title={pillar.name}
              >
                <div className={cn(
                  "rounded-full transition-all duration-1000",
                  isCompleted ? `w-3 h-3 ${bgCol} ${shadowCol}` : 
                  isActive ? `w-4 h-4 border-2 border-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.5)]` :
                  "w-2 h-2 border border-stone-600 opacity-40"
                )} />
                {/* Tiny Label on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[8px] uppercase tracking-widest text-stone-400">
                  {pillar.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THE NOW */}
      <div className="relative z-30 w-full max-w-2xl px-6 flex flex-col items-center justify-center space-y-8">
        <AnimatePresence mode="wait">
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

          {lastAiMessage && (
            <motion.div
              key={`ai-${lastAiMessage.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
              transition={{ duration: 1 }}
              className={cn(
                "w-full text-center font-serif italic",
                isMobile ? "text-lg md:text-xl leading-relaxed" : "text-2xl md:text-3xl leading-loose",
                isArchitect ? "text-red-600 font-mono" : "text-stone-100"
              )}
            >
              {displayedContent}
              {isPacing && <span className="animate-pulse ml-1 opacity-50">_</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DRIFTING MEMORIES */}
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
