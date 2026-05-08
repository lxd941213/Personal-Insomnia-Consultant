import { useState } from 'react';

interface FeedbackControlProps {
  onFeedback: (value: 'useful' | 'not_useful') => void;
}

export function FeedbackControl({ onFeedback }: FeedbackControlProps) {
  const [selected, setSelected] = useState<'useful' | 'not_useful' | null>(null);

  function record(value: 'useful' | 'not_useful') {
    setSelected(value);
    onFeedback(value);
  }

  return (
    <>
      <div className="feedback-row">
        <button type="button" aria-pressed={selected === 'useful'} onClick={() => record('useful')}>有用</button>
        <button type="button" aria-pressed={selected === 'not_useful'} onClick={() => record('not_useful')}>没用</button>
      </div>
      {selected && <p className="feedback-status">已记录反馈</p>}
    </>
  );
}
