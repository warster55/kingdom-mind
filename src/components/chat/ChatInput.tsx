'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '@/lib/contexts/ConfigContext';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, placeholder: propPlaceholder, className, disabled, autoFocus }: ChatInputProps) {
  const { get } = useConfig();
  const [input, setInput] = useState('');
  const [launchingText, setLaunchingText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const defaultPlaceholder = get('input_placeholder', 'Speak...');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024); 
    checkMobile();
    
    if (autoFocus || isMobile) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [autoFocus, isMobile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled) {
        const text = input.trim();
        setLaunchingText(text);
        onSend(text);
        setInput('');
        setTimeout(() => {
          setLaunchingText(null);
          textareaRef.current?.focus(); 
        }, 2000);
      }
    }
  };

  const handleBlur = () => {
    if (isMobile && !disabled) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-6 md:px-0 z-[100]">
      <AnimatePresence>
        {launchingText && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.2, y: -300, filter: 'blur(10px)' }}
            transition={{ duration: 1.2 }}
            className="absolute left-0 right-0 text-center pointer-events-none"
          >
            <span className="text-xl md:text-2xl font-serif italic text-stone-100 opacity-60">
              {launchingText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex justify-center">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={propPlaceholder || defaultPlaceholder}
          className={cn(
            "w-full bg-transparent border-none py-4 outline-none ring-0 resize-none",
            "text-xl md:text-2xl font-serif italic text-center leading-relaxed",
            "placeholder:text-stone-700 placeholder:opacity-50",
            className
          )}
          style={{ minHeight: '60px' }}
        />
      </div>
    </div>
  );
}
