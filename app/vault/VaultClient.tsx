'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User, Insight, Habit } from '@/lib/db/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Anchor, Compass } from 'lucide-react';

interface VaultClientProps {
  user: User;
  insights: Insight[];
  habits: Habit[];
}

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

const DOMAIN_COLORS: Record<string, string> = {
  'Identity': 'text-amber-500 bg-amber-500 shadow-amber-500/50 stroke-amber-500/20',
  'Purpose': 'text-blue-500 bg-blue-500 shadow-blue-500/50 stroke-blue-500/20',
  'Mindset': 'text-zinc-400 bg-zinc-400 shadow-zinc-400/50 stroke-zinc-400/20',
  'Relationships': 'text-rose-400 bg-rose-400 shadow-rose-400/50 stroke-rose-400/20',
  'Vision': 'text-emerald-500 bg-emerald-500 shadow-emerald-500/50 stroke-emerald-500/20',
  'Action': 'text-orange-500 bg-orange-500 shadow-orange-500/50 stroke-orange-500/20',
  'Legacy': 'text-purple-500 bg-purple-500 shadow-purple-500/50 stroke-purple-500/20',
};

export function VaultClient({ user, insights, habits }: VaultClientProps) {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [hoveredInsight, setHoveredInsight] = useState<Insight | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 20, 
        y: (e.clientY / window.innerHeight - 0.5) * 20 
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
      
      {/* Ghost Domain Labels (Celestial Geography) */}
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
              animate={{ opacity: isActive ? 0.1 : 0.03 }}
              style={{ left: `${left}%`, top: `${top}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
            >
              <span className={cn(
                "text-[4vw] font-serif italic uppercase tracking-[1em] whitespace-nowrap",
                isActive && "text-amber-500"
              )}>
                {domain}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Starfield Background */}
      <motion.div 
        style={{ x: -mousePos.x, y: -mousePos.y }}
        className="absolute inset-0 pointer-events-none opacity-30"
      >
        {[...Array(50)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2,
              height: Math.random() * 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5
            }}
          />
        ))}
      </motion.div>

      {/* Main Constellation Canvas */}
      <div className="flex-1 relative flex items-center justify-center">
        <motion.div 
          style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
          className="relative w-full h-full max-w-5xl max-h-[80%]"
        >
          {/* Constellation Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {Object.entries(constellations).map(([domain, stars]) => {
              if (stars.length < 2) return null;
              const color = DOMAIN_COLORS[domain]?.split(' ')[3] || "stroke-stone-800";
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
                        transition={{ duration: 2, delay: 1 }}
                        x1={`${star.x}%`} y1={`${star.y}%`}
                        x2={`${nextStar.x}%`} y2={`${nextStar.y}%`}
                        className={cn("stroke-[0.5] fill-none", color)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Breakthrough Stars */}
          {starMap.map((insight, idx) => {
            const size = (insight.importance || 1) * 4 + 4;
            const domainStyle = DOMAIN_COLORS[insight.domain] || DOMAIN_COLORS['Mindset'];
            const colorClass = domainStyle.split(' ')[1];

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
                  <div className={cn("rounded-full blur-xl absolute inset-0 transition-all duration-1000 opacity-0 group-hover:opacity-40", colorClass)} style={{ width: size * 8, height: size * 8 }} />
                  <div className={cn("rounded-full transition-all duration-700 shadow-lg", colorClass, selectedInsight?.id === insight.id ? "scale-150 ring-4 ring-white/10" : "group-hover:scale-125")} style={{ width: size, height: size }} />
                  
                  <AnimatePresence>
                    {hoveredInsight?.id === insight.id && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-4 px-4 py-2 bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-xl shadow-2xl whitespace-nowrap z-30 pointer-events-none">
                        <p className={cn("text-[10px] uppercase font-bold tracking-widest", domainStyle.split(' ')[0])}>{insight.domain}</p>
                        <p className="text-xs font-serif italic text-stone-300">{insight.content.substring(0, 40)}...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Selected Insight Detail Card */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl p-12 bg-stone-900/90 backdrop-blur-2xl border border-stone-800 rounded-3xl shadow-2xl text-center z-40">
              <button onClick={() => setSelectedInsight(null)} className="absolute top-4 right-6 text-stone-500 hover:text-stone-300 text-lg p-2">×</button>
              <h3 className={cn("text-[10px] uppercase tracking-[0.4em] font-bold mb-6", DOMAIN_COLORS[selectedInsight.domain]?.split(' ')[0])}>Breakthrough • {selectedInsight.domain}</h3>
              <p className="text-2xl font-serif italic leading-relaxed text-stone-100">"{selectedInsight.content}"</p>
              <div className="mt-8 text-[10px] uppercase tracking-widest text-stone-500">Recorded on {new Date(selectedInsight.createdAt).toLocaleDateString()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar: Action Anchors */}
      <div className="hidden lg:block w-96 h-full border-l border-stone-900 p-12 overflow-y-auto bg-black/40 backdrop-blur-md relative z-10">
        <div className="space-y-12 pb-32">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-500 mb-8 flex items-center gap-3"><Anchor className="w-3 h-3" /> Action Anchors</h2>
            <div className="space-y-8">
              {habits.map((habit) => (
                <div key={habit.id} className="group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("text-[10px] uppercase tracking-widest font-bold", DOMAIN_COLORS[habit.domain]?.split(' ')[0] || "text-stone-400")}>{habit.domain}</span>
                    <span className="text-[10px] font-mono text-stone-600 group-hover:text-amber-600 transition-colors">{habit.streak} DAY STREAK</span>
                  </div>
                  <h4 className="text-lg font-serif italic text-stone-200">{habit.title}</h4>
                  <p className="text-sm text-stone-500 mt-2 leading-relaxed">{habit.description}</p>
                </div>
              ))}
              {habits.length === 0 && (
                <p className="text-stone-600 text-sm font-serif italic">No action anchors set yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
