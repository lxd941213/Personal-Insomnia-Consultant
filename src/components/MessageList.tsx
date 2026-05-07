import type { ChatMessage } from '../domain/types';
import { AiResponseCard } from './AiResponseCard';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.role}`}>
          <p>{message.content}</p>
          {message.response && <AiResponseCard response={message.response} />}
        </div>
      ))}
    </div>
  );
}