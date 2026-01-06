'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  children: ReactNode;
  className?: string;
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "flex-1 overflow-y-auto scroll-smooth px-4 md:px-0 custom-scrollbar",
        className
      )}
    >
      <div className="max-w-3xl mx-auto py-12 space-y-8">
        {children}
      </div>
    </div>
  );
}
