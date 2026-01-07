'use client';

import { useStreamingChat } from '@/lib/hooks/useStreamingChat';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { Loader2 } from 'lucide-react';

interface StreamingChatProps {
  sessionId: number;
  initialMessages: Message[];
  systemPrompt: string;
  onReset: () => void;
  onMessageSent?: (content: string) => Promise<boolean>;
}

export function StreamingChat({ 
  sessionId, 
  initialMessages, 
  systemPrompt, 
  onReset,
  onMessageSent 
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

    // Allow intercepting the message (e.g. for login)
    if (onMessageSent) {
      const handled = await onMessageSent(content);
      if (handled) return;
    }

    sendMessage(content);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <ChatContainer>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600/30" />
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500 font-serif italic text-sm">
            {error}
          </div>
        )}
      </ChatContainer>

      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}