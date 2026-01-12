'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export function DailyBread() {
  const { data: bread, isLoading } = useQuery({
    queryKey: ['daily-bread'],
    queryFn: async () => {
      const res = await fetch('/api/user/bread');
      if (!res.ok) throw new Error('Failed to fetch bread');
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  if (isLoading || !bread?.verse) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-12 text-center"
      >
        <div className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="text-[10px] uppercase tracking-[0.3em] font-black text-amber-500/80"
            >
              Today's Anchor • {bread.domain}
            </motion.p>
            
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 2 }}
              className="text-2xl md:text-4xl font-serif italic text-stone-100 leading-relaxed"
            >
              "{bread.truth}"
            </motion.h2>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 4, duration: 2 }}
            className="h-px w-12 bg-stone-500 mx-auto"
          />

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 5, duration: 2 }}
            className="text-sm md:text-lg font-serif italic text-stone-400"
          >
            {bread.verse}
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
