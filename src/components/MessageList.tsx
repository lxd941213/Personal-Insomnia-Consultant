import type { ChatMessage } from '../domain/types';
import { AiResponseCard } from './AiResponseCard';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.role}`}>
          {message.response ? <AiResponseCard response={message.response} /> : <p>{message.content}</p>}
        </div>
      ))}
    </div>
  );
}