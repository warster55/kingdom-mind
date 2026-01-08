'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, LogOut, BarChart2, RefreshCw
} from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ onSend, placeholder, className }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [launchingText, setLaunchingText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const text = input.trim();
        setLaunchingText(text);
        onSend(text);
        setInput('');
        setShowMenu(false);
        setTimeout(() => setLaunchingText(null), 2000);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowMenu(val === '/');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-6 md:px-0 z-[100]">
      
      {/* THE STARDUST LAUNCH ANIMATION */}
      <AnimatePresence>
        {launchingText && (
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 0.2, 
              y: -300, 
              filter: 'blur(10px)'
            }}
            transition={{ duration: 1.2, ease: "easeIn" }}
            className="absolute left-0 right-0 text-center pointer-events-none"
          >
            <span className="text-xl md:text-2xl font-serif italic text-stone-100 opacity-60">
              {launchingText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group flex justify-center">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Share what's on your heart..."}
          className={cn(
            "w-full bg-transparent border-none py-4 outline-none ring-0 resize-none",
            "text-xl md:text-2xl font-serif italic text-center leading-relaxed transition-all duration-700",
            "placeholder:text-stone-700 dark:placeholder:text-stone-700 placeholder:opacity-50",
            "focus:placeholder:opacity-20", // Fade placeholder on focus
            className
          )}
          style={{ minHeight: '60px' }}
        />
      </div>
    </div>
  );
}