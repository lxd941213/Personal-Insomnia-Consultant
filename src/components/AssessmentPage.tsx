import { useState } from 'react';
import { isiQuestions, psqiLiteQuestions, buildAssessmentResult } from '../domain/assessment';
import type { AssessmentQuestion } from '../domain/assessment';
import type { AssessmentResult, SleepProfile } from '../domain/types';
import { saveAssessmentResult } from '../storage/localStore';

interface Props {
  profile: SleepProfile;
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
}

interface RatingRowProps {
  question: AssessmentQuestion;
  group: 'isi' | 'psqi';
  value: number | undefined;
  onChange: (id: number, value: number) => void;
}

function RatingRow({ question, group, value, onChange }: RatingRowProps) {
  return (
    <div className="rating-row" data-testid={`rating-row-${group}-${question.id}`}>
      <span className="rating-label">{question.label}</span>
      <div className="rating-options">
        {question.options.map((opt) => (
          <label key={opt.value} className="rating-option">
            <input
              type="radio"
              name={`${group}-q-${question.id}`}
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
  const hasRisk = result.riskFlags.length > 0;
  const overall = hasRisk
    ? '本次自测提示存在需要关注的睡眠风险，建议优先稳定作息并考虑专业评估。'
    : '本次自测未发现明显高风险信号，可以先从规律作息和睡前习惯开始改善。';
  const nextActions = [
    '固定每天起床时间，包括周末也尽量保持一致。',
    '连续记录 7 天上床时间、入睡估计时间、夜醒次数和白天精神状态。',
    '睡前 30 分钟减少手机、工作消息和高刺激内容。',
    '如果睡眠问题持续加重或明显影响白天功能，建议咨询专业医生或睡眠门诊。',
  ];

  return (
    <div className="assessment-report" data-testid="assessment-report">
      <h2 className="report-title">睡眠自测报告</h2>

      <div className="report-section">
        <h3>总体结论</h3>
        <p className="report-summary">{overall}</p>
      </div>

      <div className="report-section">
        <h3>失眠严重程度指数 (ISI)</h3>
        <div className="report-score">
          <span className="score-number">{result.isi.score}</span>
          <span className="score-label">/ 28</span>
        </div>
        <p className="report-level">{getIsiLevelLabel(result.isi.level)}</p>
        <p className="report-summary">{result.isi.summary}</p>
        <p className="report-hint">分数越高表示主观失眠困扰越明显。该分数用于自我筛查，不等同于医疗诊断。</p>
      </div>

      <div className="report-section">
        <h3>简化睡眠质量筛查</h3>
        <div className="report-score">
          <span className="score-number">{result.psqiLite.score}</span>
          <span className="score-label">/ 24</span>
        </div>
        <p className="report-level">{getPsqiLevelLabel(result.psqiLite.level)}</p>
        <p className="report-summary">{result.psqiLite.summary}</p>
        <p className="report-hint">该结果是简化睡眠质量筛查，用于帮助发现作息、睡眠连续性和白天功能的变化。</p>
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
      <div className="report-section">
        <h3>下一步建议</h3>
        <ul>
          {nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
      <p className="fine-print">本内容仅提供健康管理参考，不作为医疗诊断。</p>
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

export function AssessmentPage({ profile, onComplete, onBack }: Props) {
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
      setError('请完成所有题目后再生成报告');
      return;
    }
    setError(null);
    const assessmentResult = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    saveAssessmentResult(assessmentResult);
    setResult(assessmentResult);
    setShowReport(true);
    onComplete(assessmentResult);
  };

  if (showReport && result) {
    return (
      <div className="page assessment-page">
        <button type="button" className="back-btn" onClick={onBack}>返回首页</button>
        <AssessmentReport result={result} />
      </div>
    );
  }

  return (
    <div className="page assessment-page">
      <div className="panel">
        <button type="button" className="back-btn" onClick={onBack}>返回首页</button>
        <h1>睡眠自测</h1>
        <p className="form-subtitle">请根据过去一周的睡眠情况作答</p>

        <div className="assessment-section">
          <h2>失眠严重程度指数 (ISI)</h2>
          <div className="question-list">
            {isiQuestions.map((q) => (
              <RatingRow
                key={q.id}
                question={q}
                group="isi"
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
                group="psqi"
                value={psqiAnswers[q.id]}
                onChange={handlePsqiChange}
              />
            ))}
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="primary-button" onClick={handleSubmit}>
          生成自测报告
        </button>
      </div>
    </div>
  );
}
