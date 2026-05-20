import type { SafetyDisplayCopy, SafetyTriageLevel } from '../domain/types';

interface SafetyCarePanelProps {
  level: SafetyTriageLevel;
  copy: SafetyDisplayCopy;
}

export function SafetyCarePanel({ level, copy }: SafetyCarePanelProps) {
  return (
    <section className={`safety-care-panel ${level}`} aria-label="安全优先提示">
      <div className="safety-care-header">
        <span className="safety-care-level">{level === 'urgent' ? '紧急' : level === 'needs_care' ? '需评估' : '参考'}</span>
        <h2>{copy.title}</h2>
      </div>
      <p>{copy.summary}</p>
      <div className="safety-care-actions">
        {copy.actions.map((action) => (
          <article key={action.label} className="safety-care-action">
            <h3>{action.label}</h3>
            <p>{action.detail}</p>
          </article>
        ))}
      </div>
      <p className="fine-print">{copy.disclaimer}</p>
    </section>
  );
}