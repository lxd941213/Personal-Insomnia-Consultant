import type { AssessmentResult, DiarySummary, PlanRecommendation, SleepPlan, SleepProfile } from './types';

export const sleepPlans: SleepPlan[] = [
  {
    id: 'medical-evaluation',
    category: 'safety',
    title: '优先进行专业评估',
    summary: '存在安全信号时，先排查需要医疗处理的睡眠问题。',
    steps: ['记录异常表现', '预约睡眠门诊或相关专科', '避免自行增加助眠药物或保健品'],
    tags: ['安全信号'],
    safetyNote: '出现呼吸暂停、严重嗜睡或持续加重时，应优先专业评估。',
  },
  {
    id: 'fixed-wake-time',
    category: 'schedule',
    title: '固定起床时间',
    summary: '用稳定起床时间帮助生物钟重新建立节律。',
    steps: ['选择可长期坚持的起床时间', '周末浮动不超过 1 小时', '起床后接触自然光'],
    tags: ['入睡困难', '熬夜习惯', '作息稳定'],
    safetyNote: null,
  },
  {
    id: 'stimulus-control',
    category: 'cbti',
    title: '刺激控制入门',
    summary: '减少床和清醒焦虑之间的关联。',
    steps: ['困了再上床', '躺下约 20 分钟仍清醒时离床做低刺激活动', '避免在床上刷手机或工作'],
    tags: ['入睡困难', 'CBT-I'],
    safetyNote: null,
  },
  {
    id: 'breathing-before-bed',
    category: 'relaxation',
    title: '睡前 4-7-8 呼吸',
    summary: '用短时间呼吸练习降低睡前唤醒水平。',
    steps: ['吸气 4 秒', '屏息 7 秒', '呼气 8 秒', '重复 4 轮'],
    tags: ['压力焦虑', '放松训练'],
    safetyNote: '如屏息不适，可改为自然慢呼吸。',
  },
  {
    id: 'caffeine-boundary',
    category: 'nutrition',
    title: '咖啡因边界',
    summary: '减少下午和晚间咖啡因对入睡的影响。',
    steps: ['午后减少咖啡、浓茶、能量饮料', '记录摄入时间和当晚入睡耗时', '用无咖啡因饮品替代晚间习惯'],
    tags: ['营养补充', '入睡困难'],
    safetyNote: null,
  },
  {
    id: 'wellness-routine',
    category: 'wellness',
    title: '温和调理睡前流程',
    summary: '用固定、低刺激的睡前流程替代临睡前临时补救。',
    steps: ['睡前 30 分钟调暗灯光', '温水洗漱或泡脚', '做 5 分钟拉伸或呼吸'],
    tags: ['中医调理方向', '睡眠卫生'],
    safetyNote: '调理建议仅作健康管理参考，不替代诊疗。',
  },
];

interface RecommendInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: DiarySummary;
}

function makeRecommendation(
  planId: string,
  priority: number,
  reasons: string[],
  matchedSignals: string[],
  safetyNote: string | null = null,
): PlanRecommendation {
  return { planId, priority, reasons, matchedSignals, safetyNote };
}

export function recommendSleepPlans({ profile, assessmentResult, diarySummary }: RecommendInput): PlanRecommendation[] {
  if (profile.safetySignals.length > 0 || (assessmentResult?.riskFlags.length ?? 0) > 0) {
    return [
      makeRecommendation(
        'medical-evaluation',
        100,
        ['当前存在需要优先关注的安全信号，建议先排除需要医疗处理的因素。'],
        [...profile.safetySignals, ...(assessmentResult?.riskFlags ?? [])],
        `安全信号：${[...profile.safetySignals, ...(assessmentResult?.riskFlags ?? [])].join('、')}`,
      ),
    ];
  }

  const recommendations: PlanRecommendation[] = [
    makeRecommendation(
      'fixed-wake-time',
      90,
      ['入睡困难和作息偏晚时，固定起床时间通常是优先级较高的基础动作。'],
      [profile.mainConcern, profile.bedtime],
    ),
  ];

  if (profile.mainConcern === 'hard_to_fall_asleep' || (diarySummary.averageSleepLatencyMinutes ?? 0) >= 45) {
    recommendations.push(makeRecommendation(
      'stimulus-control',
      80,
      ['最近入睡耗时偏长，刺激控制可以减少床与清醒焦虑的关联。'],
      ['入睡耗时偏长'],
    ));
  }

  if (profile.stressLevel.includes('高') || profile.mainConcern === 'stress_anxiety') {
    recommendations.push(makeRecommendation(
      'breathing-before-bed',
      70,
      ['压力或睡前唤醒较高时，短时呼吸练习更容易执行。'],
      [profile.stressLevel],
      '如屏息不适，可改为自然慢呼吸。',
    ));
  }

  if (profile.habits.some((habit) => habit.includes('咖啡') || habit.includes('茶'))) {
    recommendations.push(makeRecommendation(
      'caffeine-boundary',
      60,
      ['饮品习惯可能影响入睡，可以先建立午后咖啡因边界。'],
      profile.habits,
    ));
  }

  if ((assessmentResult?.psqiLite.level === 'poor') || (diarySummary.averageSleepQuality ?? 5) <= 2.5) {
    recommendations.push(makeRecommendation(
      'wellness-routine',
      50,
      ['睡眠质量偏低时，稳定、低刺激的睡前流程有助于减少波动。'],
      ['睡眠质量偏低'],
      '调理建议仅作健康管理参考，不替代诊疗。',
    ));
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
