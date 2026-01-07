'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MessageCircle, Library } from 'lucide-react';

export function SanctuaryNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Sanctuary', href: '/reflect', icon: MessageCircle },
    { label: 'Vault', href: '/vault', icon: Library },
  ];

  return (
    <div className="fixed top-8 right-8 z-50 flex items-center gap-2 p-1 bg-white/20 dark:bg-stone-900/20 backdrop-blur-xl border border-stone-200/20 dark:border-stone-800/20 rounded-full shadow-2xl transition-all duration-700 hover:bg-white/40 dark:hover:bg-stone-900/40">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500",
              isActive 
                ? "bg-white dark:bg-stone-800 text-amber-600 shadow-lg scale-105" 
                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            )}
          >
            <item.icon className="w-3 h-3" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
