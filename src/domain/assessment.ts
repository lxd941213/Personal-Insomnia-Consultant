import type { AssessmentResult, IsiLevel, PsqiLevel } from './types';

// ISI = Insomnia Severity Index (7 items, each 0-4, total 0-28)
export interface AssessmentQuestion {
  id: number;
  label: string;
  options: { value: number; label: string }[];
}

export const isiQuestions: AssessmentQuestion[] = [
  {
    id: 0,
    label: '入睡困难',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '轻度' },
      { value: 2, label: '中度' },
      { value: 3, label: '重度' },
      { value: 4, label: '极重度' },
    ],
  },
  {
    id: 1,
    label: '睡眠维持困难',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '轻度' },
      { value: 2, label: '中度' },
      { value: 3, label: '重度' },
      { value: 4, label: '极重度' },
    ],
  },
  {
    id: 2,
    label: '早醒问题',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '轻度' },
      { value: 2, label: '中度' },
      { value: 3, label: '重度' },
      { value: 4, label: '极重度' },
    ],
  },
  {
    id: 3,
    label: '对当前睡眠模式的满意度',
    options: [
      { value: 0, label: '非常满意' },
      { value: 1, label: '满意' },
      { value: 2, label: '一般' },
      { value: 3, label: '不满意' },
      { value: 4, label: '非常不满意' },
    ],
  },
  {
    id: 4,
    label: '失眠对日常生活的影响',
    options: [
      { value: 0, label: '无影响' },
      { value: 1, label: '轻度影响' },
      { value: 2, label: '中度影响' },
      { value: 3, label: '重度影响' },
      { value: 4, label: '极重度影响' },
    ],
  },
  {
    id: 5,
    label: '失眠对情绪的影响',
    options: [
      { value: 0, label: '无影响' },
      { value: 1, label: '轻度影响' },
      { value: 2, label: '中度影响' },
      { value: 3, label: '重度影响' },
      { value: 4, label: '极重度影响' },
    ],
  },
  {
    id: 6,
    label: '对白天功能的总体影响',
    options: [
      { value: 0, label: '无影响' },
      { value: 1, label: '轻度影响' },
      { value: 2, label: '中度影响' },
      { value: 3, label: '重度影响' },
      { value: 4, label: '极重度影响' },
    ],
  },
];

// PSQILite = Simplified Pittsburgh Sleep Quality Index (6 items, each 0-3, total 0-18)
export const psqiLiteQuestions: AssessmentQuestion[] = [
  {
    id: 0,
    label: '睡眠质量',
    options: [
      { value: 0, label: '非常好' },
      { value: 1, label: '较好' },
      { value: 2, label: '较差' },
      { value: 3, label: '非常差' },
    ],
  },
  {
    id: 1,
    label: '睡眠时长',
    options: [
      { value: 0, label: '≥7小时' },
      { value: 1, label: '6-7小时（不含）' },
      { value: 2, label: '5-6小时（不含）' },
      { value: 3, label: '<5小时' },
    ],
  },
  {
    id: 2,
    label: '睡眠效率',
    options: [
      { value: 0, label: '≥85%' },
      { value: 1, label: '75-85%（不含）' },
      { value: 2, label: '65-75%（不含）' },
      { value: 3, label: '<65%' },
    ],
  },
  {
    id: 3,
    label: '睡眠障碍',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '<1次/周' },
      { value: 2, label: '1-2次/周' },
      { value: 3, label: '≥3次/周' },
    ],
  },
  {
    id: 4,
    label: '日间功能障碍',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '轻度' },
      { value: 2, label: '中度' },
      { value: 3, label: '重度' },
    ],
  },
  {
    id: 5,
    label: '主观睡眠潜伏期',
    options: [
      { value: 0, label: '≤15分钟' },
      { value: 1, label: '16-30分钟' },
      { value: 2, label: '31-60分钟' },
      { value: 3, label: '>60分钟' },
    ],
  },
];

const isiLevelLabels: Record<IsiLevel, string> = {
  normal: '正常',
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

const psqiLevelLabels: Record<PsqiLevel, string> = {
  normal: '正常',
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

const isiLevelSummaries: Record<IsiLevel, string> = {
  normal: '睡眠状态基本正常，无需特别干预',
  mild: '存在轻微失眠症状，建议调整睡眠习惯',
  moderate: '存在中度失眠，建议寻求专业指导',
  severe: '存在严重失眠，需要医学干预',
};

const psqiLevelSummaries: Record<PsqiLevel, string> = {
  normal: '睡眠质量良好',
  mild: '睡眠质量略有下降',
  moderate: '睡眠质量明显下降',
  severe: '睡眠质量严重受损',
};

export function getIsiLevel(score: number): IsiLevel {
  if (score <= 7) return 'normal';
  if (score <= 14) return 'mild';
  if (score <= 21) return 'moderate';
  return 'severe';
}

export function getPsqiLiteLevel(score: number): PsqiLevel {
  if (score <= 4) return 'normal';
  if (score <= 7) return 'mild';
  if (score <= 14) return 'moderate';
  return 'severe';
}

export function buildAssessmentResult(
  isiAnswers: Record<number, number>,
  psqiAnswers: Record<number, number>
): AssessmentResult {
  const isiScore = Object.values(isiAnswers).reduce((sum, v) => sum + v, 0);
  const psqiScore = Object.values(psqiAnswers).reduce((sum, v) => sum + v, 0);
  const isiLevel = getIsiLevel(isiScore);
  const psqiLevel = getPsqiLiteLevel(psqiScore);

  // Risk flag: severe ISI or moderate-to-severe PSQI
  const riskFlag = isiLevel === 'severe' || psqiLevel === 'moderate' || psqiLevel === 'severe';

  return {
    isiScore,
    isiLevel,
    psqiScore,
    psqiLevel,
    riskFlag,
  };
}

export { isiLevelLabels, psqiLevelLabels, isiLevelSummaries, psqiLevelSummaries };
