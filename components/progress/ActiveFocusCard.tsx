'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

const DOMAINS = [
  'Identity',
  'Purpose',
  'Mindset',
  'Relationships',
  'Vision',
  'Action',
  'Legacy'
];

export function ActiveFocusCard() {
  // We'll use a mock status for now, then hook it to the real API
  const activeDomain = 'Identity';
  const progress = 15;

  return (
    <div className="hidden lg:flex flex-col w-80 h-full border-l border-stone-100 dark:border-stone-900 bg-stone-50/50 dark:bg-stone-950/50 p-12 overflow-y-auto">
      <div className="space-y-12">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 dark:text-stone-600 mb-8">
            The Journey
          </h2>
          <div className="space-y-6">
            {DOMAINS.map((domain, index) => {
              const isActive = domain === activeDomain;
              const isCompleted = index < DOMAINS.indexOf(activeDomain);

              return (
                <div 
                  key={domain}
                  className={cn(
                    "flex items-center gap-4 transition-all duration-700",
                    isActive ? "opacity-100 scale-105" : "opacity-30 grayscale hover:opacity-50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Circle className={cn("w-4 h-4", isActive ? "text-amber-600 animate-pulse" : "text-stone-400")} />
                  )}
                  <span className={cn(
                    "text-sm font-serif italic",
                    isActive ? "text-stone-900 dark:text-stone-100 font-medium" : "text-stone-500 dark:text-stone-400"
                  )}>
                    {domain}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-12 border-t border-stone-100 dark:border-stone-900">
          <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 dark:text-stone-600 mb-4">
            Transformation
          </h2>
          <div className="text-3xl font-serif italic text-stone-800 dark:text-stone-200">
            {progress}%
          </div>
          <div className="mt-4 w-full h-px bg-stone-200 dark:bg-stone-800 relative">
            <div 
              className="absolute inset-y-0 left-0 bg-amber-600 transition-all duration-1000" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
