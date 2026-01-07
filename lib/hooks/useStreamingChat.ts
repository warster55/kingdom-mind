'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/components/chat/ChatMessage';

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
      const response = await fetch('/api/mentoring/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: content,
          systemPrompt,
          mode,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) throw new Error('Failed to reach the sanctuary system.');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Could not establish a stream.');

      const assistantId = (Date.now() + 1).toString();
      let assistantContent = '';

      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        setMessages(prev => prev.map(msg => 
          msg.id === assistantId ? { ...msg, content: assistantContent } : msg
        ));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId, systemPrompt]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    setMessages,
  };
}
