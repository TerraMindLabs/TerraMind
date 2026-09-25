import { useState, useCallback, useRef } from 'react';

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversation = useCallback(async (id: string) => {
    try {
      setConversationId(id);
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages((data.messages || []).map((m: any) => ({
          role: m.role,
          content: m.content
        })));
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  }, []);

  const startNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setConversationId(undefined);
    setMessages([]);
    setGenerationStatus(null);
    setIsGenerating(false);
  }, []);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setGenerationStatus(null);
  }, []);

  const sendMessage = async (
    content: string,
    provider: 'ollama' | 'cloud',
    model: string,
    agentId: string,
    projectId?: string,
    onConvoCreated?: (newId: string) => void
  ) => {
    if (!content.trim() || isGenerating) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newMsg: ChatMessageData = { role: 'user', content };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);
    setGenerationStatus('Connecting to agent...');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const userStr = localStorage.getItem('tm_user') || localStorage.getItem('terramind_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.id) headers['x-user-id'] = user.id;
        } catch {}
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          conversationId,
          messages: updatedMessages,
          provider,
          model,
          agentId,
          projectId
        })
      });

      if (!res.ok) {
        let errMessage = `Server error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {}
        setMessages((prev) => [...prev, { role: 'assistant', content: `> ⚠️ **Error:** ${errMessage}` }]);
        setIsGenerating(false);
        setGenerationStatus(null);
        return;
      }

      if (!res.body) {
        setIsGenerating(false);
        setGenerationStatus(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Append initial assistant placeholder
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let resolvedConvoId = conversationId;
      let sseBuffer = '';

      while (true) {
        if (controller.signal.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        // Keep the last incomplete fragment in buffer
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.replace(/^data:\s*/, '');
          if (raw === '[DONE]') break;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.conversationId && !resolvedConvoId) {
              resolvedConvoId = parsed.conversationId;
              setConversationId(resolvedConvoId);
              if (onConvoCreated && resolvedConvoId) onConvoCreated(resolvedConvoId);
            }

            // Update real-time backend status if received
            if (parsed.status) {
              setGenerationStatus(parsed.status);
            }

            if (parsed.content) {
              // Clear the preliminary status message once actual text begins streaming
              setGenerationStatus(null);
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  last.content += parsed.content;
                }
                return copy;
              });
            }
          } catch {
            // Partial JSON chunk
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        // User stopped generation intentionally - keep the content streamed so far
        return;
      }
      console.error('Streaming error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: `> ⚠️ **Connection Error:** ${err?.message || 'Failed to communicate with server'}` }]);
    } finally {
      setIsGenerating(false);
      setGenerationStatus(null);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  return {
    messages,
    sendMessage,
    isGenerating,
    generationStatus,
    conversationId,
    loadConversation,
    startNewChat,
    stopGenerating
  };
}
