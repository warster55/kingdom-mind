'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, LogOut, BarChart2, RefreshCw, Sparkles 
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
    <div className="relative w-full max-w-3xl mx-auto pb-8 md:pb-12 pt-4 px-6 md:px-0 z-[100] transition-all duration-300">
      
      {/* THE STARDUST LAUNCH ANIMATION */}
      <AnimatePresence>
        {launchingText && (
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 0.2, 
              y: -300, // Reduced launch height for mobile visibility
              filter: 'blur(10px)'
            }}
            transition={{ duration: 1.2, ease: "easeIn" }}
            className="absolute left-0 right-0 text-center pointer-events-none"
          >
            <span className="text-lg md:text-xl font-serif italic text-stone-100 opacity-60">
              {launchingText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Share what's on your heart..."}
          className={cn(
            "w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-4",
            "text-lg md:text-xl font-serif italic text-center leading-relaxed transition-all duration-700",
            "focus:outline-none focus:border-amber-500/50",
            "placeholder:text-stone-500 dark:placeholder:text-stone-700",
            className
          )}
          style={{ minHeight: '60px', resize: 'none' }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-focus-within:opacity-20 transition-opacity">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
      </div>
    </div>
  );
}
