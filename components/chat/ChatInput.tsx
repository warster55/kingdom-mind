'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/contexts/ThemeContext';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme, toggleTheme } = useTheme();

  const commands = [
    { id: 'status', label: 'My Status', icon: BarChart2, action: () => onSend('/status') },
    { id: 'theme', label: 'Toggle Theme', icon: resolvedTheme === 'dark' ? Sun : Moon, action: toggleTheme },
    { id: 'reset', label: 'Reset Journey', icon: RefreshCw, action: () => onSend('/reset') },
    { id: 'logout', label: 'Sign Out', icon: LogOut, action: () => onSend('/logout'), color: 'text-red-500' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSend(input.trim());
        setInput('');
        setShowMenu(false);
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
    <div className="relative w-full max-w-3xl mx-auto pb-12 pt-4 px-4 md:px-0 z-[100]">
      {showMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="p-2">
            {commands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setInput('');
                  setShowMenu(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left",
                  cmd.color
                )}
              >
                <cmd.icon className="w-4 h-4 opacity-60" />
                <span className="text-sm font-medium">{cmd.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
            "text-xl font-serif italic text-center leading-relaxed",
            "focus:outline-none focus:border-amber-500/50 transition-colors",
            "placeholder:text-stone-300 dark:placeholder:text-stone-700",
            className
          )}
          style={{ minHeight: '64px', resize: 'none' }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-focus-within:opacity-20 transition-opacity">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
      </div>
    </div>
  );
}
