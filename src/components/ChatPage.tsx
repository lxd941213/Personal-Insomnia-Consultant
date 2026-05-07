import { type FormEvent, useState, useCallback } from 'react';
import { sendChatMessage } from '../api/chatClient';
import type { ChatMessage, FeedbackEvent, SleepProfile } from '../domain/types';
import { clearAllLocalData, getChatHistory, getFeedbackEvents, saveChatHistory, saveFeedbackEvents } from '../storage/localStore';
import { FeedbackControl } from './FeedbackControl';
import { MessageList } from './MessageList';

interface ChatPageProps {
  profile: SleepProfile;
  onReset: () => void;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatPage({ profile, onReset }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatHistory());
  const [feedback, setFeedback] = useState<FeedbackEvent[]>(() => getFeedbackEvents());
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || pending) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: input.trim(), createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveChatHistory(nextMessages);
    setInput('');
    setPending(true);
    setError('');

    try {
      const response = await sendChatMessage({ profile, message: userMessage.content, history: messages });
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: response.summary,
        response,
        createdAt: new Date().toISOString(),
      };
      const saved = [...nextMessages, assistantMessage];
      setMessages(saved);
      saveChatHistory(saved);
    } catch {
      setInput(userMessage.content);
      setError('We could not generate advice right now. Please retry in a moment.');
    } finally {
      setPending(false);
    }
  }, [input, pending, messages, profile]);

  const recordFeedback = useCallback((value: 'useful' | 'not_useful') => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistant) return;

    const next = [...feedback, { messageId: lastAssistant.id, value, createdAt: new Date().toISOString() }];
    setFeedback(next);
    saveFeedbackEvents(next);
  }, [messages, feedback]);

  const reset = useCallback(() => {
    clearAllLocalData();
    onReset();
  }, [onReset]);

  return (
    <main className="page chat-page">
      <header className="chat-header">
        <div>
          <h1>Sleep consultation</h1>
          <p>{profile.ageRange} · {profile.mainConcern} · usual sleep {profile.bedtime}-{profile.wakeTime}</p>
        </div>
        <button type="button" onClick={reset}>Reset profile</button>
      </header>
      <MessageList messages={messages} />
      {error && <p className="error">{error}</p>}
      {messages.some((message) => message.role === 'assistant') && <FeedbackControl onFeedback={recordFeedback} />}
      <form className="chat-input" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your sleep..." />
        <button className="primary-button" disabled={pending} type="submit">{pending ? 'Sending...' : 'Send'}</button>
      </form>
      <p className="fine-print">Records are stored only in this browser. Advice is not medical diagnosis.</p>
    </main>
  );
}