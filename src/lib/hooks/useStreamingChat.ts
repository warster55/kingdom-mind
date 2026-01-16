'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/components/chat/ChatMessage';
import { sendSanctuaryMessage } from '@/lib/actions/chat';
import { readStreamableValue } from '@ai-sdk/rsc';

interface ClientAction {
  type: 'illuminate' | 'breakthrough';
  domains?: string[];
  domain?: string;
  insight?: string;
}

interface UseStreamingChatProps {
  sessionId: number;
  initialMessages?: Message[];
  onClientAction?: (action: ClientAction) => void;
}

export function useStreamingChat({ sessionId, initialMessages = [], onClientAction }: UseStreamingChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
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
      // CALL SERVER ACTION
      const { output, clientActions } = await sendSanctuaryMessage(
        sessionId,
        content,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      const assistantId = (Date.now() + 1).toString();
      let assistantContent = '';

      // Immediately add the assistant placeholder
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
          // Update the specific assistant message in real-time
          setMessages(prev => prev.map(msg =>
            msg.id === assistantId ? { ...msg, content: assistantContent } : msg
          ));
        }
      }

      // Process client actions (illuminate domains, breakthroughs, etc.)
      if (clientActions && onClientAction) {
        for await (const actions of readStreamableValue(clientActions)) {
          if (actions && Array.isArray(actions)) {
            for (const action of actions) {
              // Cast from streamable value type to our ClientAction interface
              onClientAction(action as ClientAction);
            }
          }
        }
      }

      if (!assistantContent.trim()) {
        setMessages(prev => prev.filter(msg => msg.id !== assistantId));
      }

    } catch (err: unknown) {
      console.error('[Action Error]:', err);
      const message = err instanceof Error ? err.message : 'The Sanctuary connection was interrupted.';
      setError(message);
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId, onClientAction]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    setMessages,
  };
}
