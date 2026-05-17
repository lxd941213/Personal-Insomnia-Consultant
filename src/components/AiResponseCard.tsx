import type { AiResponse } from '../domain/types';
import { SafetyNotice } from './SafetyNotice';

function splitSummary(summary: string): string[] {
  return summary
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AiResponseCard({ response }: { response: AiResponse }) {
  const summaryLines = splitSummary(response.summary);

  return (
    <article className="ai-card">
      <div className="ai-summary">
        {summaryLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      {response.possibleFactors.length > 0 && (
        <section className="ai-response-section">
          <h3>可能因素</h3>
          <ul className="ai-point-list">{response.possibleFactors.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}
      {response.suggestions.length > 0 && (
        <section className="ai-response-section">
          <h3>建议尝试</h3>
          <ul className="ai-action-list">
            {response.suggestions.map((item) => (
              <li key={`${item.title}-${item.detail}`}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {response.nextQuestions.length > 0 && (
        <section className="ai-response-section">
          <h3>后续问题</h3>
          <ul className="ai-point-list">{response.nextQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}
      <SafetyNotice notice={response.seekCareNotice} disclaimer={response.disclaimer} />
    </article>
  );
}
