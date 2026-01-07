'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, Insight, Habit } from '@/lib/db/schema';
import { motion } from 'framer-motion';
import { Sparkles, Anchor, Compass, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface VaultClientProps {
  user: User;
  insights: Insight[];
  habits: Habit[];
}

export function VaultClient({ user, insights, habits }: VaultClientProps) {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  return (
    <div className="flex h-screen w-full">
      {/* Back to Sanctuary */}
      <Link 
        href="/reflect"
        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400 hover:text-amber-600 transition-colors duration-500 group"
      >
        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
        The Sanctuary
      </Link>

      {/* Main Library View */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* The Constellation Map */}
        <div className="relative w-full h-full max-w-5xl max-h-[80%]">
          {insights.map((insight, idx) => {
            // Pseudo-random but deterministic star positions
            const x = (Math.sin(insight.id * 123.456) * 0.5 + 0.5) * 80 + 10;
            const y = (Math.cos(insight.id * 789.012) * 0.5 + 0.5) * 80 + 10;
            const size = (insight.importance || 1) * 4 + 4;

            return (
              <motion.button
                key={insight.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 1.5 }}
                onClick={() => setSelectedInsight(insight)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute group"
              >
                <div 
                  className={cn(
                    "rounded-full bg-amber-500/20 blur-xl absolute inset-0 animate-pulse",
                    selectedInsight?.id === insight.id && "bg-amber-500/40 scale-150"
                  )}
                  style={{ width: size * 4, height: size * 4, margin: -size * 1.5 }}
                />
                <div 
                  className={cn(
                    "rounded-full bg-stone-300 dark:bg-stone-700 transition-all duration-700 group-hover:bg-amber-500 shadow-lg",
                    selectedInsight?.id === insight.id && "bg-amber-600 scale-125"
                  )}
                  style={{ width: size, height: size }}
                />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <span className="text-[10px] uppercase tracking-tighter text-stone-400 font-bold">
                    {insight.domain}
                  </span>
                </div>
              </motion.button>
            );
          })}

          {insights.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fadeIn">
              <Sparkles className="w-8 h-8 text-stone-200 dark:text-stone-800" />
              <p className="text-stone-400 dark:text-stone-600 font-serif italic italic text-xl">
                Your map of truths is waiting for its first star...
              </p>
            </div>
          )}
        </div>

        {/* Floating Insight Detail */}
        {selectedInsight && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl p-12 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-100 dark:border-stone-800 rounded-3xl shadow-2xl text-center"
          >
            <button 
              onClick={() => setSelectedInsight(null)}
              className="absolute top-4 right-6 text-stone-300 hover:text-stone-500 text-lg"
            >
              ×
            </button>
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-amber-600 mb-6">
              Breakthrough • {selectedInsight.domain}
            </h3>
            <p className="text-2xl font-serif italic leading-relaxed text-stone-800 dark:text-stone-100">
              "{selectedInsight.content}"
            </p>
            <div className="mt-8 text-[10px] uppercase tracking-widest text-stone-400">
              Recorded on {new Date(selectedInsight.createdAt).toLocaleDateString()}
            </div>
          </motion.div>
        )}
      </div>

      {/* Sidebar: Action Anchors (Habits) */}
      <div className="w-96 h-full border-l border-stone-100 dark:border-stone-900 p-12 overflow-y-auto bg-stone-50/30 dark:bg-stone-950/30">
        <div className="space-y-12">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 dark:text-stone-600 mb-8 flex items-center gap-3">
              <Anchor className="w-3 h-3" /> Action Anchors
            </h2>
            <div className="space-y-8">
              {habits.map((habit) => (
                <div key={habit.id} className="group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-amber-600/60 font-bold">
                      {habit.domain}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 group-hover:text-stone-600 transition-colors">
                      {habit.streak} DAY STREAK
                    </span>
                  </div>
                  <h4 className="text-lg font-serif italic text-stone-800 dark:text-stone-200">
                    {habit.title}
                  </h4>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    {habit.description}
                  </p>
                </div>
              ))}
              {habits.length === 0 && (
                <p className="text-stone-400 text-sm font-serif italic">
                  The AI Mentor will anchor your breakthroughs with physical actions here...
                </p>
              )}
            </div>
          </div>

          <div className="pt-12 border-t border-stone-100 dark:border-stone-900">
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 dark:text-stone-600 mb-4 flex items-center gap-3">
              <Compass className="w-3 h-3" /> Core Identity
            </h2>
            <div className="text-3xl font-serif italic text-stone-800 dark:text-stone-200">
              {user.name}
            </div>
            <p className="text-sm text-stone-500 mt-2">Currently navigating the {user.currentDomain} domain.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
