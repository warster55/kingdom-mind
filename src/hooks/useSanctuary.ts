'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEncryptedBlob, setEncryptedBlob } from '@/lib/storage/sanctuary-db';
import { initializeSanctuary, sendMentorMessage, type ChatMessage, type DisplayData } from '@/lib/actions/chat';
import { INPUT_LIMITS } from '@/lib/security/sanitize';
import { saveChatMessage, loadChatHistory, clearChatHistory } from '@/lib/storage/chat-history';

export type { ChatMessage, DisplayData };
export { INPUT_LIMITS };

export interface SanctuaryState {
  isLoading: boolean;
  isNewUser: boolean;
  blob: string | null;
  display: DisplayData | null;
  error: string | null;
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
        // Load persisted chat history from IndexedDB
        const persistedHistory = await loadChatHistory();
        if (persistedHistory.length > 0) {
          setChatHistory(persistedHistory);
        }

        const existingBlob = await getEncryptedBlob();

        // Use server action to initialize/validate
        const result = await initializeSanctuary(existingBlob || undefined);

        if (result.error) {
          throw new Error(result.error);
        }

        // Store blob locally
        await setEncryptedBlob(result.blob);

        setState({
          isLoading: false,
          isNewUser: result.isNewUser,
          blob: result.blob,
          display: result.display,
          error: null,
        });
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
    const trimmed = message.trim();

    // Client-side validation (server also validates - defense in depth)
    if (!trimmed || isStreaming) return;

    // Check length limit
    if (trimmed.length > INPUT_LIMITS.MAX_MESSAGE_LENGTH) {
      // Show error message to user
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Your message is too long. Please keep it under ${INPUT_LIMITS.MAX_MESSAGE_LENGTH} characters.`,
      };
      setChatHistory(prev => [...prev, errorMessage]);
      return;
    }

    setIsStreaming(true);

    // Add user message to history
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);

    // Persist user message to IndexedDB
    await saveChatMessage({ ...userMessage, timestamp: Date.now() });

    try {
      // Use server action instead of fetch
      const data = await sendMentorMessage(
        message,
        state.blob,
        [...chatHistory, userMessage]
      );

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response to history
      if (data.response) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
        setChatHistory(prev => [...prev, assistantMessage]);

        // Persist assistant message to IndexedDB after streaming completes
        await saveChatMessage({ ...assistantMessage, timestamp: Date.now() });
      }

      // Update state with new blob and display
      if (data.blob) {
        await setEncryptedBlob(data.blob);
        setState(prev => ({
          ...prev,
          blob: data.blob,
          display: data.display || prev.display,
        }));
      }

      return {
        response: data.response || '',
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
  const clearChat = useCallback(async () => {
    setChatHistory([]);
    await clearChatHistory();
  }, []);

  // Reset sanctuary (start fresh)
  const resetSanctuary = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Use server action to create fresh sanctuary
      const result = await initializeSanctuary();

      if (result.error) {
        throw new Error(result.error);
      }

      await setEncryptedBlob(result.blob);
      setChatHistory([]);
      await clearChatHistory();
      setState({
        isLoading: false,
        isNewUser: true,
        blob: result.blob,
        display: result.display,
        error: null,
      });
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
