'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "w-full flex flex-col items-center py-12 first:pt-4 animate-fadeIn",
      !isAssistant && "opacity-60"
    )}>
      <div className="prose prose-stone dark:prose-invert max-w-none font-serif w-full text-center">
        <ReactMarkdown
          components={{
            h2: ({ ...props }) => <h2 className="text-2xl italic font-light text-stone-800 dark:text-stone-100 mb-8" {...props} />,
            p: ({ ...props }) => <p className="text-2xl leading-relaxed text-stone-800 dark:text-stone-200 italic" {...props} />,
            ul: ({ ...props }) => <ul className="list-none p-0 space-y-4 mb-8 inline-block text-left" {...props} />,
            li: ({ ...props }) => <li className="flex items-start gap-3"><span className="w-1.5 h-1.5 bg-amber-500/30 rounded-full mt-3 flex-shrink-0" /> <span {...props} /></li>,
            blockquote: ({ ...props }) => <blockquote className="border-none py-12 text-3xl font-light text-stone-400 dark:text-stone-600" {...props} />,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
