import { useState } from 'react';
import { isiQuestions, psqiLiteQuestions, buildAssessmentResult } from '../domain/assessment';
import type { AssessmentQuestion } from '../domain/assessment';
import type { AssessmentResult } from '../domain/types';
import { saveAssessmentResult } from '../storage/localStore';

interface Props {
  onComplete: (result: AssessmentResult) => void;
}

interface RatingRowProps {
  question: AssessmentQuestion;
  value: number | undefined;
  onChange: (id: number, value: number) => void;
}

function RatingRow({ question, value, onChange }: RatingRowProps) {
  return (
    <div className="rating-row" data-testid={`rating-row-${question.id}`}>
      <span className="rating-label">{question.label}</span>
      <div className="rating-options">
        {question.options.map((opt) => (
          <label key={opt.value} className="rating-option">
            <input
              type="radio"
              name={`q-${question.id}`}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(question.id, opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface AssessmentReportProps {
  result: AssessmentResult;
}

function AssessmentReport({ result }: AssessmentReportProps) {
  return (
    <div className="assessment-report" data-testid="assessment-report">
      <h2 className="report-title">评估报告</h2>

      <div className="report-section">
        <h3>失眠严重程度指数 (ISI)</h3>
        <div className="report-score">
          <span className="score-number">{result.isi.score}</span>
          <span className="score-label">/ 28</span>
        </div>
        <p className="report-level">{getIsiLevelLabel(result.isi.level)}</p>
        <p className="report-summary">{result.isi.summary}</p>
      </div>

      <div className="report-section">
        <h3>睡眠质量 (PSQI 简化版)</h3>
        <div className="report-score">
          <span className="score-number">{result.psqiLite.score}</span>
          <span className="score-label">/ 18</span>
        </div>
        <p className="report-level">{getPsqiLevelLabel(result.psqiLite.level)}</p>
        <p className="report-summary">{result.psqiLite.summary}</p>
      </div>

      {result.riskFlags.length > 0 && (
        <div className="risk-flags">
          <h4>风险提示</h4>
          <ul>
            {result.riskFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function getIsiLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    none: '无明显失眠',
    mild: '轻度失眠',
    moderate: '中度失眠',
    severe: '重度失眠',
  };
  return labels[level] ?? level;
}

function getPsqiLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    good: '睡眠质量良好',
    fair: '睡眠质量一般',
    poor: '睡眠质量较差',
  };
  return labels[level] ?? level;
}

export function AssessmentPage({ onComplete }: Props) {
  const [isiAnswers, setIsiAnswers] = useState<Record<number, number>>({});
  const [psqiAnswers, setPsqiAnswers] = useState<Record<number, number>>({});
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const handleIsiChange = (id: number, value: number) => {
    setIsiAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handlePsqiChange = (id: number, value: number) => {
    setPsqiAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const allAnswered =
    isiQuestions.every((q) => isiAnswers[q.id] !== undefined) &&
    psqiLiteQuestions.every((q) => psqiAnswers[q.id] !== undefined);

  const handleSubmit = () => {
    if (!allAnswered) {
      setError('请回答所有问题');
      return;
    }
    setError(null);
    const assessmentResult = buildAssessmentResult(isiAnswers, psqiAnswers);
    saveAssessmentResult(assessmentResult);
    setResult(assessmentResult);
    setShowReport(true);
    onComplete(assessmentResult);
  };

  if (showReport && result) {
    return <AssessmentReport result={result} />;
  }

  return (
    <div className="page assessment-page">
      <div className="panel">
        <h1>睡眠评估问卷</h1>
        <p className="form-subtitle">请根据过去一周的睡眠情况作答</p>

        <div className="assessment-section">
          <h2>失眠严重程度指数 (ISI)</h2>
          <div className="question-list">
            {isiQuestions.map((q) => (
              <RatingRow
                key={q.id}
                question={q}
                value={isiAnswers[q.id]}
                onChange={handleIsiChange}
              />
            ))}
          </div>
        </div>

        <div className="assessment-section">
          <h2>睡眠质量 (PSQI 简化版)</h2>
          <div className="question-list">
            {psqiLiteQuestions.map((q) => (
              <RatingRow
                key={q.id}
                question={q}
                value={psqiAnswers[q.id]}
                onChange={handlePsqiChange}
              />
            ))}
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="primary-button" onClick={handleSubmit}>
          提交评估
        </button>
      </div>
    </div>
  );
}