'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

interface StreamingChatProps {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  mode?: 'mentor' | 'architect';
}

export function StreamingChat({ 
  messages,
  isStreaming,
  error,
  mode = 'mentor'
}: StreamingChatProps) {
  const isArchitect = mode === 'architect';
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-scale logic to fit screen without scrolling
  useEffect(() => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      if (scrollHeight > clientHeight) {
        setScale(Math.max(0.5, clientHeight / scrollHeight));
      } else {
        setScale(1);
      }
    }
  }, [messages]);

  // Only show the last 3-4 exchanges to keep focus, with the latest being the largest
  const visibleMessages = messages.slice(-4);

  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000",
      isArchitect ? "bg-stone-950" : "bg-transparent"
    )}>
      
      {/* The Sanctuary Pulse (Thinking Animation) */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.1, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className={cn(
              "w-[40vw] h-[40vw] rounded-full blur-[120px]",
              isArchitect ? "bg-red-900/20" : "bg-amber-500/10"
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Living Text Canvas */}
      <motion.div 
        ref={containerRef}
        animate={{ scale }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl px-8 flex flex-col items-center justify-center space-y-12 pb-32"
      >
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((msg, idx) => {
            const isLast = idx === visibleMessages.length - 1;
            const isSecondLast = idx === visibleMessages.length - 2;
            const opacity = isLast ? 1 : isSecondLast ? 0.4 : 0.1;
            const blur = isLast ? 0 : isSecondLast ? 2 : 4;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ 
                  opacity, 
                  y: 0, 
                  filter: `blur(${blur}px)`,
                  scale: isLast ? 1 : 0.9
                }}
                exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  "w-full text-center transition-all duration-1000",
                  isArchitect ? "font-mono" : "font-serif italic"
                )}
              >
                <div className={cn(
                  "max-w-none leading-relaxed",
                  isLast ? "text-3xl md:text-4xl text-stone-800 dark:text-stone-100" : "text-xl md:text-2xl text-stone-400 dark:text-stone-600",
                  isArchitect && (msg.role === 'assistant' ? "text-red-600" : "text-red-400")
                )}>
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {error && (
        <div className="absolute top-1/2 -translate-y-1/2 text-red-500 font-serif italic text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
