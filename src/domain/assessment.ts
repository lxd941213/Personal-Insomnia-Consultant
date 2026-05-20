import type { AssessmentResult, AssessmentUncertainItem, IsiLevel, PsqiLevel, SleepProfile } from './types';

// ISI = Insomnia Severity Index (7 items, each 0-4, total 0-28)
export interface AssessmentQuestion {
  id: number;
  label: string;
  helperText?: string;
  uncertainFallbackValue?: number;
  options: { value: number; label: string }[];
}

export const isiQuestions: AssessmentQuestion[] = [
  {
    id: 0,
    label: '入睡困难',
    helperText: '按过去一周入睡卡住的频率和困扰程度估计即可。',
    uncertainFallbackValue: 2,
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
    helperText: '包括夜里醒来后难再睡、睡得断断续续。',
    uncertainFallbackValue: 2,
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
    helperText: '指比计划起床时间早醒，并且醒后较难继续睡。',
    uncertainFallbackValue: 2,
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
    helperText: '轻度可理解为偶尔受影响，中度为多天受影响，重度为明显影响工作生活。',
    uncertainFallbackValue: 2,
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
    helperText: '可按烦躁、焦虑、低落或担心睡不着的程度估计。',
    uncertainFallbackValue: 2,
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
    helperText: '看注意力、精力、工作学习效率和社交状态是否受影响。',
    uncertainFallbackValue: 2,
    options: [
      { value: 0, label: '无影响' },
      { value: 1, label: '轻度影响' },
      { value: 2, label: '中度影响' },
      { value: 3, label: '重度影响' },
      { value: 4, label: '极重度影响' },
    ],
  },
];

// PSQILite = simplified sleep quality screen (6 items, each 0-4, total 0-24)
export const psqiLiteQuestions: AssessmentQuestion[] = [
  {
    id: 0,
    label: '睡眠质量',
    options: [
      { value: 0, label: '非常好' },
      { value: 1, label: '较好' },
      { value: 2, label: '较差' },
      { value: 3, label: '非常差' },
      { value: 4, label: '极差' },
    ],
  },
  {
    id: 1,
    label: '睡眠时长',
    helperText: '估算真正睡着的总时长，不需要精确到分钟。',
    uncertainFallbackValue: 2,
    options: [
      { value: 0, label: '≥7小时' },
      { value: 1, label: '6-7小时（不含）' },
      { value: 2, label: '5-6小时（不含）' },
      { value: 3, label: '<5小时' },
      { value: 4, label: '<4小时' },
    ],
  },
  {
    id: 2,
    label: '睡眠效率',
    helperText: '大概是躺床时间里真正睡着的比例；不好算时可以选“不好判断”。',
    uncertainFallbackValue: 2,
    options: [
      { value: 0, label: '≥85%' },
      { value: 1, label: '75-85%（不含）' },
      { value: 2, label: '65-75%（不含）' },
      { value: 3, label: '<65%' },
      { value: 4, label: '<50%' },
    ],
  },
  {
    id: 3,
    label: '睡眠障碍',
    helperText: '包括夜醒、做梦困扰、憋醒、疼痛、噪音等让睡眠中断的情况。',
    uncertainFallbackValue: 2,
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '<1次/周' },
      { value: 2, label: '1-2次/周' },
      { value: 3, label: '≥3次/周' },
      { value: 4, label: '几乎每晚多次' },
    ],
  },
  {
    id: 4,
    label: '日间功能障碍',
    helperText: '按白天困倦、注意力下降、效率下降或情绪波动估计。',
    uncertainFallbackValue: 2,
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '轻度' },
      { value: 2, label: '中度' },
      { value: 3, label: '重度' },
      { value: 4, label: '极重度' },
    ],
  },
  {
    id: 5,
    label: '主观睡眠潜伏期',
    helperText: '指从准备睡觉到大概睡着的时间，凭印象估算即可。',
    uncertainFallbackValue: 2,
    options: [
      { value: 0, label: '≤15分钟' },
      { value: 1, label: '16-30分钟' },
      { value: 2, label: '31-60分钟' },
      { value: 3, label: '>60分钟' },
      { value: 4, label: '>120分钟' },
    ],
  },
];

const isiLevelLabels: Record<IsiLevel, string> = {
  none: '无明显失眠',
  mild: '轻度失眠',
  moderate: '中度失眠',
  severe: '重度失眠',
};

const psqiLevelLabels: Record<PsqiLevel, string> = {
  good: '睡眠质量良好',
  fair: '睡眠质量一般',
  poor: '睡眠质量较差',
};

const isiLevelSummaries: Record<IsiLevel, string> = {
  none: '当前 ISI 自评分未显示明显失眠倾向，可继续保持稳定作息。',
  mild: '当前 ISI 自评分提示轻度失眠倾向，建议先从作息和睡前习惯调整入手。',
  moderate: '当前 ISI 自评分提示中度失眠倾向，建议连续观察并考虑寻求专业评估。',
  severe: '当前 ISI 自评分提示较重失眠倾向，建议尽快寻求专业医生或睡眠门诊评估。',
};

const psqiLevelSummaries: Record<PsqiLevel, string> = {
  good: '简化睡眠质量筛查显示整体睡眠质量较好，可继续保持现有节律。',
  fair: '简化睡眠质量筛查显示部分睡眠指标有所下降，建议注意作息规律。',
  poor: '简化睡眠质量筛查显示睡眠质量较差，如果持续存在，建议寻求专业评估。',
};

export function getIsiLevel(score: number): IsiLevel {
  if (score <= 7) return 'none';
  if (score <= 14) return 'mild';
  if (score <= 21) return 'moderate';
  return 'severe';
}

export function getPsqiLiteLevel(score: number): PsqiLevel {
  if (score <= 5) return 'good';
  if (score <= 11) return 'fair';
  return 'poor';
}

function sortedAnswers(answers: Record<number, number>): number[] {
  return Object.keys(answers)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => answers[Number(key)]);
}

export function buildAssessmentResult(input: {
  isiAnswers: Record<number, number>;
  psqiLiteAnswers: Record<number, number>;
  profile: SleepProfile;
  uncertainty?: {
    items?: AssessmentUncertainItem[];
    note?: string;
  };
  now?: Date;
}): AssessmentResult {
  const { isiAnswers, psqiLiteAnswers, profile } = input;
  const isiAnsArray = Object.keys(isiAnswers)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => isiAnswers[Number(k)]);
  const psqiAnsArray = sortedAnswers(psqiLiteAnswers);

  const isiScore = Object.values(isiAnswers).reduce((sum, v) => sum + v, 0);
  const psqiScore = Object.values(psqiLiteAnswers).reduce((sum, v) => sum + v, 0);
  const isiLevel = getIsiLevel(isiScore);
  const psqiLevel = getPsqiLiteLevel(psqiScore);

  const riskFlags: string[] = [];
  if (isiLevel === 'severe') {
    riskFlags.push('失眠严重度较高');
  }
  if (psqiLevel === 'poor') {
    riskFlags.push('睡眠质量较差');
  }
  if ((psqiLiteAnswers[1] ?? 0) >= 3) riskFlags.push('实际睡眠时长明显不足');
  if ((psqiLiteAnswers[4] ?? 0) >= 3) riskFlags.push('白天功能受影响较明显');
  if ((psqiLiteAnswers[5] ?? 0) >= 3) riskFlags.push('存在助眠药物或酒精依赖风险');
  profile.safetySignals.forEach((signal) => riskFlags.push(`存在安全信号：${signal}`));

  const uncertainItems = input.uncertainty?.items ?? [];
  const note = input.uncertainty?.note?.trim() ?? '';
  const responseQuality =
    uncertainItems.length > 0 || note
      ? {
          confidence: uncertainItems.length > 0 ? 'estimated' as const : 'standard' as const,
          uncertainCount: uncertainItems.length,
          uncertainItems,
          note,
        }
      : undefined;

  const result: AssessmentResult = {
    completedAt: (input.now ?? new Date()).toISOString(),
    isi: {
      answers: isiAnsArray,
      score: isiScore,
      level: isiLevel,
      summary: isiLevelSummaries[isiLevel],
    },
    psqiLite: {
      answers: psqiAnsArray,
      score: psqiScore,
      level: psqiLevel,
      summary: psqiLevelSummaries[psqiLevel],
    },
    riskFlags: Array.from(new Set(riskFlags)),
  };
  if (responseQuality) {
    result.responseQuality = responseQuality;
  }
  return result;
}

export { isiLevelLabels, psqiLevelLabels, isiLevelSummaries, psqiLevelSummaries };
