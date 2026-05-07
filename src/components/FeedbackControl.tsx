interface FeedbackControlProps {
  onFeedback: (value: 'useful' | 'not_useful') => void;
}

export function FeedbackControl({ onFeedback }: FeedbackControlProps) {
  return (
    <div className="feedback-row">
      <button type="button" onClick={() => onFeedback('useful')}>Useful</button>
      <button type="button" onClick={() => onFeedback('not_useful')}>Not useful</button>
    </div>
  );
}