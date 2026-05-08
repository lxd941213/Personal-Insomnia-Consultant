import type { AiResponse } from '../domain/types';
import { SafetyNotice } from './SafetyNotice';

export function AiResponseCard({ response }: { response: AiResponse }) {
  return (
    <article className="ai-card">
      <p>{response.summary}</p>
      {response.possibleFactors.length > 0 && (
        <section>
          <h3>可能因素</h3>
          <ul>{response.possibleFactors.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}
      {response.suggestions.length > 0 && (
        <section>
          <h3>建议尝试</h3>
          <ul>{response.suggestions.map((item) => <li key={item.title}><strong>{item.title}</strong>: {item.detail}</li>)}</ul>
        </section>
      )}
      {response.nextQuestions.length > 0 && (
        <section>
          <h3>后续问题</h3>
          <ul>{response.nextQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}
      <SafetyNotice notice={response.seekCareNotice} disclaimer={response.disclaimer} />
    </article>
  );
}