'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEncryptedBlob, setEncryptedBlob, hasSanctuary } from '@/lib/storage/sanctuary-db';

export interface DisplayData {
  stars: Record<string, number>;
  stage: number;
  totalBreakthroughs: number;
}

export interface SanctuaryState {
  isLoading: boolean;
  isNewUser: boolean;
  blob: string | null;
  display: DisplayData | null;
  error: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useSanctuary() {
  const [state, setState] = useState<SanctuaryState>({
    isLoading: true,
    isNewUser: false,
    blob: null,
    display: null,
    error: null,
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize - load existing sanctuary or create new one
  useEffect(() => {
    async function init() {
      try {
        const existingBlob = await getEncryptedBlob();

        if (existingBlob) {
          // Existing user - validate blob with server
          const response = await fetch('/api/sanctuary/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: '', // Empty message just to validate
              blob: existingBlob,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setState({
              isLoading: false,
              isNewUser: false,
              blob: data.blob || existingBlob,
              display: data.display,
              error: null,
            });

            // Store updated blob if provided
            if (data.blob) {
              await setEncryptedBlob(data.blob);
            }
            return;
          }
        }

        // New user or invalid blob - create fresh sanctuary
        const response = await fetch('/api/sanctuary/chat');
        if (response.ok) {
          const data = await response.json();
          await setEncryptedBlob(data.blob);
          setState({
            isLoading: false,
            isNewUser: true,
            blob: data.blob,
            display: data.display,
            error: null,
          });
        } else {
          throw new Error('Failed to create sanctuary');
        }
      } catch (error) {
        console.error('[Sanctuary] Init error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize sanctuary',
        }));
      }
    }

    init();
  }, []);

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;

    setIsStreaming(true);

    // Add user message to history
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/sanctuary/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          blob: state.blob,
          chatHistory: [...chatHistory, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();

      // Add assistant response to history
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatHistory(prev => [...prev, assistantMessage]);

      // Update state with new blob and display
      if (data.blob) {
        await setEncryptedBlob(data.blob);
        setState(prev => ({
          ...prev,
          blob: data.blob,
          display: data.display || prev.display,
          // Note: isNewUser stays true for the session so biometric prompt can show
        }));
      }

      return {
        response: data.response,
        breakthroughCount: data.breakthroughCount || 0,
      };
    } catch (error) {
      console.error('[Sanctuary] Send error:', error);

      // Add error response
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setChatHistory(prev => [...prev, errorMessage]);

      return { response: errorMessage.content, breakthroughCount: 0 };
    } finally {
      setIsStreaming(false);
    }
  }, [state.blob, chatHistory, isStreaming]);

  // Clear chat history (but keep sanctuary data)
  const clearChat = useCallback(() => {
    setChatHistory([]);
  }, []);

  // Reset sanctuary (start fresh)
  const resetSanctuary = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/sanctuary/chat');
      if (response.ok) {
        const data = await response.json();
        await setEncryptedBlob(data.blob);
        setChatHistory([]);
        setState({
          isLoading: false,
          isNewUser: true,
          blob: data.blob,
          display: data.display,
          error: null,
        });
      }
    } catch (error) {
      console.error('[Sanctuary] Reset error:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to reset' }));
    }
  }, []);

  return {
    ...state,
    chatHistory,
    isStreaming,
    sendMessage,
    clearChat,
    resetSanctuary,
  };
}
