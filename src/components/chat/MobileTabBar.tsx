'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Activity, MessageSquare, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'GALAXY' | 'PULSE' | 'CHAT' | 'ARCHIVES';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: 'GALAXY', label: 'Galaxy', icon: Sparkles },
  { id: 'PULSE', label: 'Pulse', icon: Activity },
  { id: 'CHAT', label: 'Chat', icon: MessageSquare },
  { id: 'ARCHIVES', label: 'Logs', icon: Archive },
];

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div className="bg-stone-950 border-t border-stone-800 shrink-0 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px]",
                isActive
                  ? "text-amber-500"
                  : "text-stone-500 active:text-stone-300"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full"
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wide",
                isActive ? "text-amber-500" : "text-stone-600"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
