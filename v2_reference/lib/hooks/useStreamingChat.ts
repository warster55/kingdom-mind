'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/components/chat/ChatMessage';
import { sendSanctuaryMessage } from '@/lib/actions/chat';
import { readStreamableValue } from '@ai-sdk/rsc';

interface UseStreamingChatProps {
  sessionId: number;
  initialMessages?: Message[];
  systemPrompt: string;
}

export function useStreamingChat({ sessionId, initialMessages = [], systemPrompt }: UseStreamingChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, mode: 'mentor' | 'architect' = 'mentor') => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    try {
      // CALL SERVER ACTION (Internal only)
      const { output } = await sendSanctuaryMessage(
        sessionId, 
        content, 
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        mode
      );

      const assistantId = (Date.now() + 1).toString();
      let assistantContent = '';

      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      // READ STREAM FROM ACTION
      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          assistantContent += delta;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantId ? { ...msg, content: assistantContent } : msg
          ));
        }
      }

      if (!assistantContent.trim()) {
        setMessages(prev => prev.filter(msg => msg.id !== assistantId));
      }

    } catch (err: any) {
      console.error('[Action Error]:', err);
      setError(err.message || 'The Sanctuary connection was interrupted.');
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    setMessages,
  };
}
