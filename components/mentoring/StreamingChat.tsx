'use client';

import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-1000",
      isArchitect ? "bg-stone-950" : "bg-transparent"
    )}>
      <ChatContainer>
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            className={isArchitect ? "font-mono" : ""}
            contentClassName={cn(
              isArchitect && msg.role === 'assistant' ? "text-red-600" : "",
              isArchitect && msg.role === 'user' ? "text-red-400" : ""
            )}
          />
        ))}
        {isStreaming && (
          <div className="flex justify-center py-8">
            <Loader2 className={cn(
              "w-4 h-4 animate-spin",
              isArchitect ? "text-red-600/30" : "text-amber-600/30"
            )} />
          </div>
        )}
        {error && (
          <div className={cn(
            "text-center py-8 font-serif italic text-sm text-red-500"
          )}>
            {error}
          </div>
        )}
      </ChatContainer>
    </div>
  );
}