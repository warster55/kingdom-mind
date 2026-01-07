'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Message } from './ChatMessage';

interface ChatMessageProps {
  message: Message;
  className?: string;
  contentClassName?: string;
  isFloating?: boolean;
  position?: { x: number; y: number };
  scale?: number;
  opacity?: number;
  blur?: number;
  onClick?: () => void;
}

export function ChatMessage({ 
  message, 
  className, 
  contentClassName, 
  isFloating,
  position,
  scale = 1,
  opacity = 1,
  blur = 0,
  onClick
}: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  if (isFloating && position) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: position.x, y: position.y + 20 }}
        animate={{ 
          opacity, 
          scale, 
          x: position.x, 
          y: position.y,
          filter: `blur(${blur}px)` 
        }}
        whileHover={{ scale: scale * 1.05, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        onClick={onClick}
        className={cn(
          "absolute cursor-pointer group pointer-events-auto",
          className
        )}
      >
        {/* The Drift Animation (Subtle oscillation) */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, 5, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "prose prose-stone dark:prose-invert max-w-lg font-serif text-center",
            contentClassName
          )}
        >
          <ReactMarkdown
            components={{
              p: ({ ...props }) => <p className="text-xl md:text-2xl leading-relaxed italic" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </motion.div>
      </motion.div>
    );
  }

  // Standard non-floating fallback (used for the User Echo)
  return (
    <div className={cn(
      "w-full flex flex-col items-center animate-fadeIn",
      className
    )}>
      <div className={cn(
        "prose prose-stone dark:prose-invert max-w-none font-serif w-full text-center",
        contentClassName
      )}>
        <ReactMarkdown
          components={{
            p: ({ ...props }) => <p className="text-lg md:text-xl leading-relaxed opacity-40 italic" {...props} />,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
