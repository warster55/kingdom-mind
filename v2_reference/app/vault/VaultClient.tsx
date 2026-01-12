'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User, Insight, Habit } from '@/lib/db/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Anchor, Compass, X } from 'lucide-react';

interface VaultClientProps {
  user: User;
  insights: Insight[];
  habits: Habit[];
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

export function VaultClient({ user, insights, habits }: VaultClientProps) {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [hoveredInsight, setHoveredInsight] = useState<Insight | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    <div className="flex h-screen w-full relative bg-stone-950 overflow-hidden text-stone-100">
      
      {/* RADIANT DOMAIN LABELS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {DOMAINS.map((domain, i) => {
          const isActive = user.currentDomain === domain;
          const angle = (i / DOMAINS.length) * Math.PI * 2;
          const dist = 35; 
          const left = 50 + Math.cos(angle) * dist;
          const top = 50 + Math.sin(angle) * dist;

          return (
            <motion.div
              key={domain}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isActive ? 0.3 : 0.08,
                scale: isActive ? 1.1 : 1
              }}
              style={{ left: `${left}%`, top: `${top}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
            >
              <span className={cn(
                "text-[4vw] font-serif italic uppercase tracking-[1em] whitespace-nowrap transition-all duration-1000",
                isActive ? "text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]" : "text-stone-700"
              )}>
                {domain}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* DYNAMIC STARFIELD */}
      <motion.div 
        style={{ x: -mousePos.x, y: -mousePos.y }}
        className="absolute inset-0 pointer-events-none opacity-40"
      >
        {[...Array(80)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2,
              height: Math.random() * 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8
            }}
          />
        ))}
      </motion.div>

      {/* CONSTELLATION CANVAS */}
      <div className="flex-1 relative flex items-center justify-center">
        <motion.div 
          style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
          className="relative w-full h-full max-w-5xl max-h-[80%]"
        >
          {/* RADIANT CONSTELLATION LINES */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {Object.entries(constellations).map(([domain, stars]) => {
              if (stars.length < 2) return null;
              const colorClass = DOMAIN_COLORS[domain]?.split(' ')[3] || "stroke-stone-800/20";
              return (
                <g key={domain}>
                  {stars.map((star, i) => {
                    const nextStar = stars[i + 1];
                    if (!nextStar) return null;
                    return (
                      <motion.line
                        key={`${star.id}-${nextStar.id}`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                        x1={`${star.x}%`} y1={`${star.y}%`}
                        x2={`${nextStar.x}%`} y2={`${nextStar.y}%`}
                        className={cn("stroke-[1] fill-none transition-all duration-1000", colorClass)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* BIOLUMINESCENT STARS */}
          {starMap.map((insight, idx) => {
            const size = (insight.importance || 1) * 4 + 6;
            const style = DOMAIN_COLORS[insight.domain] || DOMAIN_COLORS['Mindset'];
            const [textCol, bgCol, shadowCol] = style.split(' ');

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 1.5 }}
                style={{ left: `${insight.x}%`, top: `${insight.y}%` }}
                className="absolute"
              >
                <button
                  onMouseEnter={() => setHoveredInsight(insight)}
                  onMouseLeave={() => setHoveredInsight(null)}
                  onClick={() => setSelectedInsight(insight)}
                  className="relative group flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                >
                  <div className={cn("rounded-full blur-2xl absolute inset-0 transition-all duration-1000 opacity-20 group-hover:opacity-80", bgCol)} style={{ width: size * 6, height: size * 6 }} />
                  <div className={cn("rounded-full transition-all duration-700", bgCol, shadowCol, selectedInsight?.id === insight.id ? "scale-150 ring-4 ring-white/30" : "group-hover:scale-125")} style={{ width: size, height: size }} />
                  
                  <AnimatePresence>
                    {hoveredInsight?.id === insight.id && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-6 px-6 py-3 bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] whitespace-nowrap z-30 pointer-events-none">
                        <p className={cn("text-[10px] uppercase font-black tracking-[0.3em]", textCol)}>{insight.domain}</p>
                        <p className="text-sm font-serif italic text-stone-200 mt-1">{insight.content.substring(0, 50)}...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* INSIGHT DETAIL CARD */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl p-16 bg-stone-900/95 backdrop-blur-3xl border border-stone-800 rounded-[40px] shadow-2xl text-center z-40">
              <button onClick={() => setSelectedInsight(null)} className="absolute top-8 right-10 text-stone-500 hover:text-stone-200 transition-colors p-2"><X /></button>
              <h3 className={cn("text-[10px] uppercase tracking-[0.5em] font-black mb-10", DOMAIN_COLORS[selectedInsight.domain]?.split(' ')[0])}>Breakthrough • {selectedInsight.domain}</h3>
              <p className="text-3xl font-serif italic leading-relaxed text-white drop-shadow-sm">"{selectedInsight.content}"</p>
              <div className="mt-12 text-[10px] uppercase tracking-[0.3em] text-stone-600 font-bold">Anchored on {new Date(selectedInsight.createdAt).toLocaleDateString()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SIDEBAR: ACTION ANCHORS */}
      <div className="hidden lg:block w-96 h-full border-l border-stone-900/50 p-12 overflow-y-auto bg-black/40 backdrop-blur-2xl relative z-10">
        <div className="space-y-16 pb-32">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-stone-600 mb-12 flex items-center gap-4"><Anchor className="w-3 h-3 opacity-50" /> Action Anchors</h2>
            <div className="space-y-10">
              {habits.map((habit) => (
                <div key={habit.id} className="group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn("text-[10px] uppercase tracking-[0.2em] font-black", DOMAIN_COLORS[habit.domain]?.split(' ')[0] || "text-stone-500")}>{habit.domain}</span>
                    <span className="text-[10px] font-mono text-stone-700 group-hover:text-amber-500 transition-colors">{habit.streak} DAY STREAK</span>
                  </div>
                  <h4 className="text-xl font-serif italic text-stone-300 group-hover:text-white transition-colors leading-tight">{habit.title}</h4>
                  <p className="text-sm text-stone-600 mt-3 leading-relaxed font-light">{habit.description}</p>
                </div>
              ))}
              {habits.length === 0 && (
                <p className="text-stone-700 text-sm font-serif italic">Your journey's actions will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}