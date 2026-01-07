'use client';

import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamingChatProps {
  sessionId: number;
  initialMessages: Message[];
  systemPrompt: string;
  onReset: () => void;
  onMessageSent?: (content: string) => Promise<boolean>;
  mode?: 'mentor' | 'architect';
}

export function StreamingChat({ 
  sessionId, 
  initialMessages, 
  systemPrompt, 
  onReset,
  onMessageSent,
  mode = 'mentor'
}: StreamingChatProps) {
  const { messages, isStreaming, error, sendMessage } = useStreamingChat({
    sessionId,
    initialMessages,
    systemPrompt,
  });

  const handleSend = async (content: string) => {
    if (content === '/reset') {
      onReset();
      return;
    }

    if (onMessageSent) {
      const handled = await onMessageSent(content);
      if (handled) return;
    }

    sendMessage(content, mode);
  };

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
            "text-center py-8 font-serif italic text-sm",
            isArchitect ? "text-red-500" : "text-red-500"
          )}>
            {error}
          </div>
        )}
      </ChatContainer>

      <ChatInput 
        onSend={handleSend} 
        disabled={isStreaming} 
        placeholder={isArchitect ? "[ ARCHITECT MODE ACTIVE ] >_" : undefined}
        className={isArchitect ? "font-mono text-red-600 placeholder:text-red-900/30 border-red-900/20" : ""}
      />
    </div>
  );
}
