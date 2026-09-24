import { useState, useCallback } from 'react';

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

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
    setConversationId(undefined);
    setMessages([]);
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

    const newMsg: ChatMessageData = { role: 'user', content };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messages: updatedMessages,
          provider,
          model,
          agentId,
          projectId
        })
      });

      if (!res.body) {
        setIsGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Append initial assistant placeholder
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let resolvedConvoId = conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const raw = line.replace('data: ', '').trim();
          if (raw === '[DONE]') break;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.conversationId && !resolvedConvoId) {
              resolvedConvoId = parsed.conversationId;
              setConversationId(resolvedConvoId);
              if (onConvoCreated && resolvedConvoId) onConvoCreated(resolvedConvoId);
            }

            if (parsed.content) {
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
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    messages,
    sendMessage,
    isGenerating,
    conversationId,
    loadConversation,
    startNewChat
  };
}
