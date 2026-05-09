# Personalized Profile Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add richer sleep profile inputs and a deterministic personalization layer that drives safer, more targeted AI sleep guidance.

**Architecture:** Keep the current React/Vite app structure and add one focused domain module, `src/domain/personalization.ts`, that turns profile, assessment, and diary evidence into testable recommendation context. UI and API layers consume that context, while medical safety boundaries stay deterministic and outside the model.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, existing local storage and API prompt modules.

---

## Scope Check

This plan implements the approved first phase only:

- Enhanced profile inputs.
- Deterministic personalization analysis.
- Prompt integration and safety-aware chat behavior.
- 7-day plan context surfaced through existing plan UI.

This plan excludes feedback learning, diary-driven model training, high-frequency knowledge-card automation, and A/B testing.

## File Structure

- Modify `src/domain/types.ts`: add optional profile fields and personalization output types.
- Create `src/domain/personalization.ts`: deterministic personalization builder and helper formatting.
- Create `src/domain/personalization.test.ts`: severity, care advice, TCM, supplement boundary, and 7-day plan coverage.
- Modify `src/components/ProfileWizard.tsx`: render new compact inputs and submit enhanced profile data.
- Modify `src/components/ProfileWizard.test.tsx`: cover new fields and legacy-safe behavior.
- Modify `api/prompt.ts`: accept optional personalization context and include it in the model prompt.
- Modify `api/prompt.test.ts`: cover personalization prompt content and safety boundaries.
- Modify `api/chatLogic.ts`: build personalization context before provider calls and use care advice for high-risk fallback.
- Modify `api/chat.test.ts`: verify severe deterministic risk skips provider.
- Modify `src/domain/sleepPlans.ts`: use personalization context to expose 7-day plan recommendations.
- Modify `src/domain/sleepPlans.test.ts`: cover 7-day personalization plan.
- Modify `src/components/PlansPage.tsx`: show 7-day tasks from personalization context.
- Modify `src/components/PlansPage.test.tsx`: cover rendered daily tasks if the file exists; create it if absent.

Do not change unrelated pages or styles unless a test fails because the new UI cannot be selected or read.

## Task 1: Types and Personalization Domain

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/personalization.ts`
- Create: `src/domain/personalization.test.ts`

- [ ] **Step 1: Write the failing personalization tests**

Create `src/domain/personalization.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { buildPersonalizationProfile, formatPersonalizationForPrompt } from './personalization';
import type { AssessmentResult, DiarySummary, SleepProfile } from './types';

const baseProfile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const diarySummary: DiarySummary = {
  entryCount: 7,
  averageSleepDurationMinutes: 285,
  averageSleepLatencyMinutes: 65,
  averageAwakenings: 2,
  averageSleepQuality: 2,
};

function assessment(level: AssessmentResult['isi']['level'], psqiLevel: AssessmentResult['psqiLite']['level']): AssessmentResult {
  return {
    completedAt: '2026-05-09T00:00:00.000Z',
    isi: { answers: [], score: level === 'severe' ? 23 : level === 'moderate' ? 17 : 10, level, summary: '评估结果' },
    psqiLite: { answers: [], score: psqiLevel === 'poor' ? 14 : psqiLevel === 'fair' ? 8 : 3, level: psqiLevel, summary: '睡眠质量' },
    riskFlags: [],
  };
}

describe('buildPersonalizationProfile', () => {
  it('handles legacy profiles that do not contain enhanced optional fields', () => {
    const result = buildPersonalizationProfile({
      profile: baseProfile,
      assessmentResult: null,
      diarySummary: undefined,
    });

    expect(result.severity).toBe('mild');
    expect(result.careAdvice.shouldSeekCare).toBe(false);
    expect(result.safetyBoundaries).toContain('本内容仅供参考，非医疗诊断');
  });

  it('treats apnea or self-harm safety evidence as severe and urgent', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        safetySignals: ['疑似睡眠呼吸暂停'],
        medicalConditions: ['疑似呼吸暂停'],
      },
      assessmentResult: null,
      diarySummary,
    });

    expect(result.severity).toBe('severe');
    expect(result.careAdvice).toMatchObject({ shouldSeekCare: true, urgency: 'urgent' });
    expect(result.careAdvice.reasons.join('、')).toContain('疑似睡眠呼吸暂停');
  });

  it('recommends care for chronic insomnia with daytime impairment', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        concernDuration: '3个月以上',
        daytimeImpact: '白天明显疲惫，工作受影响',
      },
      assessmentResult: assessment('moderate', 'fair'),
      diarySummary,
    });

    expect(result.severity).toBe('moderate');
    expect(result.careAdvice.shouldSeekCare).toBe(true);
    expect(result.careAdvice.urgency).toBe('soon');
  });

  it('keeps supplement guidance non-dosing and safety oriented', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        dietHabit: ['午后咖啡因', '晚餐过晚'],
        medicationStatus: ['正在服用其他药物'],
      },
      assessmentResult: null,
      diarySummary,
    });

    expect(result.nutritionTargets.join('。')).toContain('褪黑素');
    expect(result.safetyBoundaries.join('。')).toContain('不提供药物或补充剂剂量');
    expect(result.nutritionTargets.join('。')).not.toMatch(/\d+\s*(mg|毫克|克)/i);
  });

  it('returns non-diagnostic TCM-style wellness direction', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        emotionState: ['焦虑', '烦躁'],
        stressLevel: '很高',
      },
      assessmentResult: null,
      diarySummary,
    });

    expect(result.tcmDirection.pattern).toBe('liver_qi_stagnation');
    expect(result.tcmDirection.label).toContain('体质倾向');
    expect(result.tcmDirection.disclaimer).toContain('不作为医疗诊断');
  });

  it('builds exactly seven daily tasks', () => {
    const result = buildPersonalizationProfile({ profile: baseProfile, assessmentResult: null, diarySummary });

    expect(result.sevenDayPlan).toHaveLength(7);
    expect(result.sevenDayPlan.map((item) => item.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.sevenDayPlan[0]).toMatchObject({
      title: expect.any(String),
      task: expect.any(String),
      checkInPrompt: expect.any(String),
    });
  });
});

describe('formatPersonalizationForPrompt', () => {
  it('summarizes deterministic context for the model prompt', () => {
    const result = buildPersonalizationProfile({
      profile: { ...baseProfile, phoneUsageHabit: '睡前1小时内频繁使用' },
      assessmentResult: assessment('mild', 'fair'),
      diarySummary,
    });

    const text = formatPersonalizationForPrompt(result);

    expect(text).toContain('个性化睡眠分析');
    expect(text).toContain('严重程度');
    expect(text).toContain('7天改善计划');
    expect(text).toContain('不提供药物或补充剂剂量');
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- src/domain/personalization.test.ts --run
```

Expected: FAIL with an import error because `src/domain/personalization.ts` does not exist yet.

- [ ] **Step 3: Add profile and personalization types**

In `src/domain/types.ts`, extend `SleepProfile` and add these exported types after `PlanRecommendation`:

```ts
export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'unspecified';
export type OccupationStress = 'low' | 'moderate' | 'high' | 'very_high' | 'unspecified';
export type PersonalizationSeverity = 'low' | 'mild' | 'moderate' | 'severe';
export type CareUrgency = 'routine' | 'soon' | 'urgent';
export type TcmPattern =
  | 'qi_deficiency'
  | 'yin_deficiency'
  | 'liver_qi_stagnation'
  | 'phlegm_dampness'
  | 'balanced'
  | 'unclear';

export interface PersonalizedSleepProfile {
  severity: PersonalizationSeverity;
  careAdvice: {
    shouldSeekCare: boolean;
    reasons: string[];
    urgency: CareUrgency;
  };
  behaviorTargets: string[];
  relaxationTargets: string[];
  nutritionTargets: string[];
  exerciseTargets: string[];
  tcmDirection: {
    pattern: TcmPattern;
    label: string;
    guidance: string[];
    disclaimer: string;
  };
  sevenDayPlan: Array<{
    day: number;
    title: string;
    task: string;
    checkInPrompt: string;
  }>;
  safetyBoundaries: string[];
}
```

Update `SleepProfile` to include optional fields:

```ts
export interface SleepProfile {
  ageRange: string;
  bedtime: string;
  wakeTime: string;
  mainConcern: MainConcern;
  concernDuration: string;
  stressLevel: string;
  habits: string[];
  daytimeImpact: string;
  safetySignals: string[];
  optionalContext: string;
  gender?: Gender;
  sleepDurationHours?: string;
  occupationStress?: OccupationStress;
  emotionState?: string[];
  exerciseHabit?: string;
  dietHabit?: string[];
  phoneUsageHabit?: string;
  medicationStatus?: string[];
  medicalConditions?: string[];
}
```

- [ ] **Step 4: Implement the personalization module**

Create `src/domain/personalization.ts`:

```ts
import type {
  AssessmentResult,
  DiarySummary,
  PersonalizedSleepProfile,
  SleepProfile,
  TcmPattern,
} from './types';

function includesAny(values: string[], patterns: string[]): boolean {
  return values.some((value) => patterns.some((pattern) => value.includes(pattern)));
}

function profileSignals(profile: SleepProfile): string[] {
  return [
    ...profile.safetySignals,
    ...(profile.emotionState ?? []),
    ...(profile.dietHabit ?? []),
    ...(profile.medicationStatus ?? []),
    ...(profile.medicalConditions ?? []),
    profile.daytimeImpact,
    profile.optionalContext,
  ].filter(Boolean);
}

function hasDaytimeImpairment(profile: SleepProfile): boolean {
  return /疲惫|嗜睡|工作|学习|功能|影响|无法/.test(profile.daytimeImpact);
}

function sleepDurationUnderFive(profile: SleepProfile, diarySummary?: DiarySummary): boolean {
  const fromProfile = Number(profile.sleepDurationHours);
  const fromDiary = diarySummary?.averageSleepDurationMinutes;
  return (Number.isFinite(fromProfile) && fromProfile > 0 && fromProfile < 5) || (typeof fromDiary === 'number' && fromDiary < 300);
}

function buildCareReasons(profile: SleepProfile, assessmentResult: AssessmentResult | null, diarySummary?: DiarySummary): string[] {
  const signals = profileSignals(profile);
  const reasons: string[] = [];
  if (includesAny(signals, ['自伤', '伤害自己', '轻生'])) reasons.push('存在自伤或严重情绪风险信号');
  if (includesAny(signals, ['呼吸暂停', '憋醒', '打鼾'])) reasons.push('存在疑似睡眠呼吸暂停信号');
  if (includesAny(signals, ['胸痛', '重大基础疾病', '慢性病'])) reasons.push('存在基础疾病或胸痛相关信号');
  if (includesAny(signals, ['孕期', '产后'])) reasons.push('孕期或产后睡眠问题需要谨慎评估');
  if (includesAny(signals, ['长期使用助眠药', '药物依赖', '每晚使用'])) reasons.push('存在助眠药物依赖或长期用药信号');
  if (assessmentResult?.isi.level === 'severe') reasons.push('ISI 结果提示重度失眠倾向');
  if (profile.concernDuration.includes('3个月') && hasDaytimeImpairment(profile)) reasons.push('睡眠困扰超过3个月且影响白天功能');
  if (sleepDurationUnderFive(profile, diarySummary) && hasDaytimeImpairment(profile)) reasons.push('睡眠时长明显不足且伴随白天影响');
  return Array.from(new Set(reasons));
}

function determineSeverity(
  profile: SleepProfile,
  assessmentResult: AssessmentResult | null,
  diarySummary: DiarySummary | undefined,
  careReasons: string[],
): PersonalizedSleepProfile['severity'] {
  if (careReasons.length > 0 || profile.safetySignals.length > 0 || assessmentResult?.isi.level === 'severe') return 'severe';
  if (
    assessmentResult?.isi.level === 'moderate' ||
    assessmentResult?.psqiLite.level === 'poor' ||
    (profile.concernDuration.includes('3个月') && hasDaytimeImpairment(profile)) ||
    sleepDurationUnderFive(profile, diarySummary)
  ) {
    return 'moderate';
  }
  if (
    assessmentResult?.isi.level === 'mild' ||
    profile.concernDuration.includes('1-3个月') ||
    profile.stressLevel.includes('高') ||
    profile.habits.length > 0 ||
    (profile.dietHabit ?? []).length > 0
  ) {
    return 'mild';
  }
  return 'low';
}

function determineTcm(profile: SleepProfile): PersonalizedSleepProfile['tcmDirection'] {
  const signals = profileSignals(profile);
  let pattern: TcmPattern = 'unclear';
  if (profile.mainConcern === 'daytime_sleepiness' || includesAny(signals, ['疲惫', '乏力', '低能量'])) pattern = 'qi_deficiency';
  if (profile.mainConcern === 'vivid_dreams' || includesAny(signals, ['盗汗', '燥热', '多梦'])) pattern = 'yin_deficiency';
  if (profile.stressLevel.includes('高') || includesAny(signals, ['焦虑', '烦躁', '压力'])) pattern = 'liver_qi_stagnation';
  if (includesAny(signals, ['晚餐过晚', '辛辣高糖', '身体沉重', '夜宵'])) pattern = 'phlegm_dampness';

  const labels: Record<TcmPattern, string> = {
    qi_deficiency: '气虚体质倾向',
    yin_deficiency: '阴虚体质倾向',
    liver_qi_stagnation: '肝郁气滞体质倾向',
    phlegm_dampness: '痰湿体质倾向',
    balanced: '相对平衡体质倾向',
    unclear: '体质倾向暂不明确',
  };
  const guidance: Record<TcmPattern, string[]> = {
    qi_deficiency: ['保持规律作息', '选择温和运动', '避免过度消耗'],
    yin_deficiency: ['减少熬夜和辛辣刺激', '睡前降低屏幕刺激', '保持卧室凉爽舒适'],
    liver_qi_stagnation: ['安排睡前放松仪式', '记录压力触发因素', '尝试呼吸或冥想练习'],
    phlegm_dampness: ['晚餐提前并减轻负担', '减少夜宵和高糖食物', '白天增加轻中等活动'],
    balanced: ['维持稳定作息', '继续观察睡眠日记'],
    unclear: ['先记录一周睡眠、饮食、情绪和活动变化', '避免过早下结论'],
  };
  return {
    pattern,
    label: labels[pattern],
    guidance: guidance[pattern],
    disclaimer: '中医体质方向仅供健康管理参考，不作为医疗诊断。',
  };
}

function sevenDayPlan(profile: SleepProfile): PersonalizedSleepProfile['sevenDayPlan'] {
  const phoneTask = profile.phoneUsageHabit?.includes('频繁') || profile.habits.some((habit) => habit.includes('手机'));
  return [
    { day: 1, title: '固定起床时间', task: `明早按 ${profile.wakeTime || '固定时间'} 起床，周末也尽量不偏离1小时。`, checkInPrompt: '今天是否按计划起床？' },
    { day: 2, title: '建立睡前边界', task: phoneTask ? '睡前30分钟把手机移出床边，改用纸质阅读或呼吸练习。' : '睡前30分钟降低灯光和刺激活动。', checkInPrompt: '睡前30分钟是否减少屏幕刺激？' },
    { day: 3, title: '记录睡眠窗口', task: '记录上床、入睡估计、醒来和起床时间，不追求当天立刻改善。', checkInPrompt: '今天是否完成睡眠记录？' },
    { day: 4, title: '刺激控制练习', task: '躺下约20分钟仍清醒时，离床做低刺激活动，困了再回床。', checkInPrompt: '清醒焦虑时是否离床调整？' },
    { day: 5, title: '饮食与咖啡因边界', task: '午后减少咖啡、浓茶和能量饮料，晚餐避免过晚过饱。', checkInPrompt: '今天是否守住咖啡因和晚餐边界？' },
    { day: 6, title: '轻中等运动', task: '白天安排20-30分钟散步或轻中等运动，避免临睡前剧烈运动。', checkInPrompt: '今天是否完成温和活动？' },
    { day: 7, title: '复盘与调整', task: '回顾一周中最有效的一项行动，下周保留并简化执行。', checkInPrompt: '哪一项对你最有帮助？' },
  ];
}

export function buildPersonalizationProfile(input: {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary?: DiarySummary;
}): PersonalizedSleepProfile {
  const { profile, assessmentResult, diarySummary } = input;
  const careReasons = buildCareReasons(profile, assessmentResult, diarySummary);
  const severity = determineSeverity(profile, assessmentResult, diarySummary, careReasons);
  const medicationSignals = profile.medicationStatus ?? [];
  const dietSignals = profile.dietHabit ?? [];

  return {
    severity,
    careAdvice: {
      shouldSeekCare: careReasons.length > 0,
      reasons: careReasons,
      urgency: careReasons.some((reason) => reason.includes('自伤') || reason.includes('呼吸暂停')) ? 'urgent' : careReasons.length > 0 ? 'soon' : 'routine',
    },
    behaviorTargets: [
      '固定起床时间',
      '刺激控制',
      profile.mainConcern === 'hard_to_fall_asleep' ? '睡眠限制疗法需在专业指导下了解和执行' : '稳定睡眠窗口',
      profile.phoneUsageHabit || profile.habits.some((habit) => habit.includes('手机')) ? '睡前手机边界' : '睡前低刺激流程',
    ],
    relaxationTargets: ['4-7-8呼吸或自然慢呼吸', '渐进式肌肉放松', '睡前冥想音频或白噪音'],
    nutritionTargets: [
      dietSignals.some((item) => item.includes('咖啡')) ? '建立午后咖啡因边界' : '观察咖啡因摄入与入睡耗时',
      dietSignals.some((item) => item.includes('晚餐')) ? '晚餐提前并避免过饱' : '保持晚间饮食清淡稳定',
      medicationSignals.length > 0
        ? '褪黑素、镁、色氨酸等补充剂需先咨询医生或营养专业人士'
        : '如考虑褪黑素、镁、色氨酸等补充剂，应先确认适用性和禁忌',
    ],
    exerciseTargets: ['优先安排白天自然光和散步', '选择轻中等强度有氧运动', '避免睡前2小时内剧烈运动'],
    tcmDirection: determineTcm(profile),
    sevenDayPlan: sevenDayPlan(profile),
    safetyBoundaries: [
      '本内容仅供参考，非医疗诊断',
      '不提供药物或补充剂剂量',
      '不自行增减或停用处方药',
      '出现严重症状、自伤想法、疑似呼吸暂停或胸痛时及时就医',
    ],
  };
}

export function formatPersonalizationForPrompt(personalization: PersonalizedSleepProfile): string {
  return `个性化睡眠分析：
- 严重程度：${personalization.severity}
- 是否建议就医：${personalization.careAdvice.shouldSeekCare ? '是' : '否'}
- 就医原因：${personalization.careAdvice.reasons.join('、') || '暂无'}
- 行为建议方向：${personalization.behaviorTargets.join('、')}
- 放松技巧方向：${personalization.relaxationTargets.join('、')}
- 饮食补充边界：${personalization.nutritionTargets.join('、')}
- 运动调整方向：${personalization.exerciseTargets.join('、')}
- 中医调养方向：${personalization.tcmDirection.label}；${personalization.tcmDirection.guidance.join('、')}；${personalization.tcmDirection.disclaimer}
- 安全边界：${personalization.safetyBoundaries.join('、')}
- 7天改善计划：${personalization.sevenDayPlan.map((item) => `第${item.day}天 ${item.title}：${item.task}`).join('；')}`;
}
```

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
npm test -- src/domain/personalization.test.ts --run
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add src/domain/types.ts src/domain/personalization.ts src/domain/personalization.test.ts
git commit -m "feat: add personalization profile analysis"
```

Only stage these three files.

## Task 2: Enhanced Profile Wizard Inputs

**Files:**
- Modify: `src/components/ProfileWizard.tsx`
- Modify: `src/components/ProfileWizard.test.tsx`

- [ ] **Step 1: Write failing profile wizard coverage**

Append this test to `src/components/ProfileWizard.test.tsx`:

```tsx
  it('collects enhanced personalization fields', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ProfileWizard onComplete={onComplete} />);

    await user.selectOptions(screen.getByLabelText('年龄段'), '35-44岁');
    await user.selectOptions(screen.getByLabelText('性别'), 'female');
    await user.type(screen.getByLabelText('通常就寝时间'), '23:30');
    await user.type(screen.getByLabelText('通常起床时间'), '06:30');
    await user.selectOptions(screen.getByLabelText('睡眠时长'), '5');
    await user.selectOptions(screen.getByLabelText('主要睡眠问题'), 'early_waking');
    await user.selectOptions(screen.getByLabelText('问题持续时间'), '3个月以上');
    await user.selectOptions(screen.getByLabelText('压力水平'), '很高');
    await user.selectOptions(screen.getByLabelText('职业压力'), 'very_high');
    await user.click(screen.getByRole('button', { name: '焦虑' }));
    await user.selectOptions(screen.getByLabelText('运动习惯'), '每周1-2次轻运动');
    await user.click(screen.getByRole('button', { name: '午后咖啡因' }));
    await user.selectOptions(screen.getByLabelText('手机使用习惯'), '睡前1小时内频繁使用');
    await user.click(screen.getByRole('button', { name: '长期使用助眠药' }));
    await user.click(screen.getByRole('button', { name: '慢性病' }));
    await user.type(screen.getByLabelText('白天影响'), '白天工作受影响');
    await user.click(screen.getByRole('button', { name: '开始咨询' }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      gender: 'female',
      sleepDurationHours: '5',
      occupationStress: 'very_high',
      emotionState: ['焦虑'],
      exerciseHabit: '每周1-2次轻运动',
      dietHabit: ['午后咖啡因'],
      phoneUsageHabit: '睡前1小时内频繁使用',
      medicationStatus: ['长期使用助眠药'],
      medicalConditions: ['慢性病'],
    }));
  });
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm test -- src/components/ProfileWizard.test.tsx --run
```

Expected: FAIL because labels such as `性别`, `睡眠时长`, and `职业压力` do not exist.

- [ ] **Step 3: Add option constants and initial state**

In `src/components/ProfileWizard.tsx`, add these constants near existing `habits`:

```tsx
const emotionOptions = ['焦虑', '情绪低落', '烦躁', '平稳'];
const dietOptions = ['午后咖啡因', '夜间饮酒', '晚餐过晚', '辛辣高糖'];
const medicationOptions = ['未用药', '偶尔使用助眠产品', '长期使用助眠药', '正在服用其他药物'];
const medicalConditionOptions = ['无', '慢性病', '疼痛', '孕期或产后', '疑似呼吸暂停'];
```

Update the initial `profile` state:

```tsx
  const [profile, setProfile] = useState<SleepProfile>({
    ageRange: '',
    bedtime: '',
    wakeTime: '',
    mainConcern: 'hard_to_fall_asleep',
    concernDuration: '',
    stressLevel: '',
    habits: [],
    daytimeImpact: '',
    safetySignals: [],
    optionalContext: '',
    gender: 'unspecified',
    sleepDurationHours: '',
    occupationStress: 'unspecified',
    emotionState: [],
    exerciseHabit: '',
    dietHabit: [],
    phoneUsageHabit: '',
    medicationStatus: [],
    medicalConditions: [],
  });
```

Replace `toggleListValue` with:

```tsx
  function toggleListValue(
    key: 'habits' | 'safetySignals' | 'emotionState' | 'dietHabit' | 'medicationStatus' | 'medicalConditions',
    value: string,
  ) {
    setProfile((current) => {
      const values = current[key] ?? [];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  }
```

- [ ] **Step 4: Render enhanced inputs**

In `ProfileWizard`, render these fields after `年龄段`:

```tsx
        <label>
          性别
          <select value={profile.gender ?? 'unspecified'} onChange={(event) => update('gender', event.target.value as SleepProfile['gender'])}>
            <option value="unspecified">暂不说明</option>
            <option value="female">女性</option>
            <option value="male">男性</option>
            <option value="non_binary">非二元</option>
            <option value="prefer_not_to_say">不愿透露</option>
          </select>
        </label>
```

Render these fields after `通常起床时间`:

```tsx
        <label>
          睡眠时长
          <select value={profile.sleepDurationHours ?? ''} onChange={(event) => update('sleepDurationHours', event.target.value)}>
            <option value="">请选择</option>
            {['4', '5', '6', '7', '8', '9'].map((option) => <option key={option} value={option}>{option}小时左右</option>)}
          </select>
        </label>
```

Render this field after `压力水平`:

```tsx
        <label>
          职业压力
          <select value={profile.occupationStress ?? 'unspecified'} onChange={(event) => update('occupationStress', event.target.value as SleepProfile['occupationStress'])}>
            <option value="unspecified">暂不说明</option>
            <option value="low">较低</option>
            <option value="moderate">中等</option>
            <option value="high">较高</option>
            <option value="very_high">很高</option>
          </select>
        </label>
```

Render these fields after the existing `睡眠相关习惯` fieldset:

```tsx
        <fieldset className="chip-fieldset">
          <legend>情绪状态</legend>
          <div className="chip-grid">
            {emotionOptions.map((label) => {
              const selected = (profile.emotionState ?? []).includes(label);
              return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('emotionState', label)}>{label}</button>;
            })}
          </div>
        </fieldset>

        <label>
          运动习惯
          <select value={profile.exerciseHabit ?? ''} onChange={(event) => update('exerciseHabit', event.target.value)}>
            <option value="">请选择</option>
            {['几乎不运动', '每周1-2次轻运动', '每周3次以上中等运动', '经常夜间剧烈运动'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>

        <fieldset className="chip-fieldset">
          <legend>饮食习惯</legend>
          <div className="chip-grid">
            {dietOptions.map((label) => {
              const selected = (profile.dietHabit ?? []).includes(label);
              return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('dietHabit', label)}>{label}</button>;
            })}
          </div>
        </fieldset>

        <label>
          手机使用习惯
          <select value={profile.phoneUsageHabit ?? ''} onChange={(event) => update('phoneUsageHabit', event.target.value)}>
            <option value="">请选择</option>
            {['睡前基本不用', '睡前偶尔使用', '睡前1小时内频繁使用', '醒来后会长时间看手机'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>

        <fieldset className="chip-fieldset">
          <legend>用药情况</legend>
          <div className="chip-grid">
            {medicationOptions.map((label) => {
              const selected = (profile.medicationStatus ?? []).includes(label);
              return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('medicationStatus', label)}>{label}</button>;
            })}
          </div>
        </fieldset>

        <fieldset className="chip-fieldset">
          <legend>基础疾病</legend>
          <div className="chip-grid">
            {medicalConditionOptions.map((label) => {
              const selected = (profile.medicalConditions ?? []).includes(label);
              return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('medicalConditions', label)}>{label}</button>;
            })}
          </div>
        </fieldset>
```

- [ ] **Step 5: Run profile wizard tests**

Run:

```bash
npm test -- src/components/ProfileWizard.test.tsx --run
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/components/ProfileWizard.tsx src/components/ProfileWizard.test.tsx
git commit -m "feat: collect enhanced sleep profile fields"
```

Only stage these two files.

## Task 3: Prompt and Chat Safety Integration

**Files:**
- Modify: `api/prompt.ts`
- Modify: `api/prompt.test.ts`
- Modify: `api/chatLogic.ts`
- Modify: `api/chat.test.ts`

- [ ] **Step 1: Write failing prompt test**

Append this test to `api/prompt.test.ts`:

```ts
  it('includes personalization context and safety boundaries', () => {
    const prompt = buildSleepAdvisorPrompt(
      profile,
      '请给我一个7天计划',
      [],
      undefined,
      undefined,
      {
        severity: 'moderate',
        careAdvice: { shouldSeekCare: true, reasons: ['睡眠困扰超过3个月且影响白天功能'], urgency: 'soon' },
        behaviorTargets: ['固定起床时间', '刺激控制'],
        relaxationTargets: ['渐进式肌肉放松'],
        nutritionTargets: ['褪黑素、镁、色氨酸等补充剂需先咨询医生或营养专业人士'],
        exerciseTargets: ['避免睡前2小时内剧烈运动'],
        tcmDirection: {
          pattern: 'liver_qi_stagnation',
          label: '肝郁气滞体质倾向',
          guidance: ['安排睡前放松仪式'],
          disclaimer: '中医体质方向仅供健康管理参考，不作为医疗诊断。',
        },
        sevenDayPlan: [
          { day: 1, title: '固定起床时间', task: '按固定时间起床。', checkInPrompt: '是否完成？' },
          { day: 2, title: '睡前边界', task: '减少屏幕刺激。', checkInPrompt: '是否完成？' },
          { day: 3, title: '记录睡眠', task: '记录睡眠窗口。', checkInPrompt: '是否完成？' },
          { day: 4, title: '刺激控制', task: '清醒时离床。', checkInPrompt: '是否完成？' },
          { day: 5, title: '饮食边界', task: '减少咖啡因。', checkInPrompt: '是否完成？' },
          { day: 6, title: '温和运动', task: '白天散步。', checkInPrompt: '是否完成？' },
          { day: 7, title: '复盘', task: '保留有效行动。', checkInPrompt: '是否完成？' },
        ],
        safetyBoundaries: ['不提供药物或补充剂剂量', '不自行增减或停用处方药'],
      },
    );

    expect(prompt).toContain('个性化睡眠分析');
    expect(prompt).toContain('睡眠困扰超过3个月且影响白天功能');
    expect(prompt).toContain('不提供药物或补充剂剂量');
    expect(prompt).toContain('7天改善计划');
  });
```

- [ ] **Step 2: Write failing chat test**

Append this test to `api/chat.test.ts`:

```ts
  it('uses deterministic personalization safety before calling provider', async () => {
    vi.mocked(callAiProvider).mockClear();
    const res = mockRes();

    await handler({
      method: 'POST',
      body: {
        profile: {
          ...profile,
          concernDuration: '3个月以上',
          daytimeImpact: '白天明显疲惫，工作受影响',
          medicationStatus: ['长期使用助眠药'],
        },
        message: '我还能怎么改善睡眠？',
        history: [],
      },
    } as never, res as never);

    expect(callAiProvider).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ riskLevel: 'high_risk' });
  });
```

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
npm test -- api/prompt.test.ts api/chat.test.ts --run
```

Expected: FAIL because `buildSleepAdvisorPrompt` does not accept personalization context and `processChat` does not build deterministic personalization yet.

- [ ] **Step 4: Update prompt builder signature and content**

In `api/prompt.ts`, update imports:

```ts
import { formatPersonalizationForPrompt } from '../src/domain/personalization';
import type { AssessmentResult, ChatMessage, PersonalizedSleepProfile, SleepProfile, SleepScenario } from '../src/domain/types';
```

Change the signature:

```ts
export function buildSleepAdvisorPrompt(
  profile: SleepProfile,
  message: string,
  history: ChatMessage[] = [],
  assessmentResult?: AssessmentResult,
  scenario?: SleepScenario,
  personalization?: PersonalizedSleepProfile,
): string {
```

Add this near `assessmentContext`:

```ts
  const personalizationContext = personalization ? `\n\n${formatPersonalizationForPrompt(personalization)}` : '';
```

Add these model instructions after the existing high-risk paragraph:

```ts
如果提供了“个性化睡眠分析”，必须优先遵循其中的严重程度、就医建议和安全边界。
不得提供处方、具体药物剂量或补充剂剂量；涉及褪黑素、镁、色氨酸等补充剂时，只能建议咨询医生、药师或营养专业人士评估适用性。
如果用户要求计划，优先使用“7天改善计划”中的每日任务。
```

Insert `${personalizationContext}` after `${assessmentContext}` in the returned prompt.

- [ ] **Step 5: Update chat logic**

In `api/chatLogic.ts`, update imports:

```ts
import { buildPersonalizationProfile } from '../src/domain/personalization';
```

Inside `processChat`, after max length validation and before the current high-risk check, add:

```ts
  const personalization = buildPersonalizationProfile({
    profile: input.profile,
    assessmentResult: input.assessmentResult ?? null,
  });

  if (personalization.careAdvice.shouldSeekCare) {
    return { status: 200, body: safeFallbackResponse() };
  }
```

Update the provider prompt call:

```ts
    const prompt = buildSleepAdvisorPrompt(
      input.profile,
      input.message,
      input.history || [],
      input.assessmentResult,
      input.scenario,
      personalization,
    );
```

Keep the existing `detectHighRiskSignal(input.message) || input.profile.safetySignals.length > 0` check after the personalization check so message-level urgent signals still skip the provider.

- [ ] **Step 6: Run prompt and chat tests**

Run:

```bash
npm test -- api/prompt.test.ts api/chat.test.ts --run
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add api/prompt.ts api/prompt.test.ts api/chatLogic.ts api/chat.test.ts
git commit -m "feat: use personalization in chat prompts"
```

Only stage these four files.

## Task 4: 7-Day Plan Recommendations and Display

**Files:**
- Modify: `src/domain/sleepPlans.ts`
- Modify: `src/domain/sleepPlans.test.ts`
- Modify: `src/components/PlansPage.tsx`
- Create or modify: `src/components/PlansPage.test.tsx`

- [ ] **Step 1: Write failing sleep plan test**

Append this test to `src/domain/sleepPlans.test.ts`:

```ts
  it('includes a seven-day personalization plan when deterministic analysis is available', () => {
    const recommendations = recommendSleepPlans({
      profile: {
        ...profile,
        phoneUsageHabit: '睡前1小时内频繁使用',
        dietHabit: ['午后咖啡因'],
      },
      assessmentResult: assessment,
      diarySummary,
    });

    expect(recommendations.map((item) => item.planId)).toContain('seven-day-personalized-plan');
  });
```

- [ ] **Step 2: Add or update PlansPage test**

If `src/components/PlansPage.test.tsx` does not exist, create it with:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlansPage } from './PlansPage';
import type { AssessmentResult, SleepDiaryEntry, SleepProfile } from '../domain/types';

vi.mock('../storage/localStore', () => ({
  getDiaryEntries: (): SleepDiaryEntry[] => [],
}));

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
  phoneUsageHabit: '睡前1小时内频繁使用',
};

const assessmentResult: AssessmentResult = {
  completedAt: '2026-05-09T00:00:00.000Z',
  isi: { answers: [], score: 10, level: 'mild', summary: '轻度失眠' },
  psqiLite: { answers: [], score: 8, level: 'fair', summary: '睡眠质量一般' },
  riskFlags: [],
};

describe('PlansPage', () => {
  it('renders seven daily personalization tasks', () => {
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getByText('7天改善计划')).toBeInTheDocument();
    expect(screen.getByText(/第1天/)).toBeInTheDocument();
    expect(screen.getByText(/第7天/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
npm test -- src/domain/sleepPlans.test.ts src/components/PlansPage.test.tsx --run
```

Expected: FAIL because `seven-day-personalized-plan` and rendered daily tasks do not exist.

- [ ] **Step 4: Update plan recommendations**

In `src/domain/sleepPlans.ts`, import the builder:

```ts
import { buildPersonalizationProfile } from './personalization';
```

Add a built-in plan to `sleepPlans`:

```ts
  {
    id: 'seven-day-personalized-plan',
    category: 'schedule',
    title: '7天改善计划',
    summary: '把画像分析转化为一周内可执行的每日打卡任务。',
    steps: ['固定起床时间', '建立睡前边界', '记录睡眠窗口', '刺激控制练习', '饮食边界', '温和运动', '复盘调整'],
    tags: ['7天计划', '个性化'],
    safetyNote: '如存在严重症状或安全信号，应优先专业评估。',
  },
```

Inside `recommendSleepPlans`, after the initial `recommendations` array is created and before sorting, add:

```ts
  const personalization = buildPersonalizationProfile({ profile, assessmentResult, diarySummary });
  if (!personalization.careAdvice.shouldSeekCare) {
    recommendations.push(makeRecommendation(
      'seven-day-personalized-plan',
      75,
      ['根据画像、评估和睡眠记录生成一周内可执行的每日任务。'],
      personalization.sevenDayPlan.map((item) => `第${item.day}天：${item.title}`),
      personalization.safetyBoundaries.join('；'),
    ));
  }
```

- [ ] **Step 5: Render 7-day tasks in PlansPage**

In `src/components/PlansPage.tsx`, import the builder:

```tsx
import { buildPersonalizationProfile } from '../domain/personalization';
```

After `recommendations`, add:

```tsx
  const personalization = buildPersonalizationProfile({ profile, assessmentResult, diarySummary });
```

Render this section before `全部方案`:

```tsx
      <section className="plan-card">
        <h2>7天改善计划</h2>
        {personalization.sevenDayPlan.map((item) => (
          <article key={item.day}>
            <h3>第{item.day}天：{item.title}</h3>
            <p>{item.task}</p>
            <p>{item.checkInPrompt}</p>
          </article>
        ))}
      </section>
```

- [ ] **Step 6: Run plan tests**

Run:

```bash
npm test -- src/domain/sleepPlans.test.ts src/components/PlansPage.test.tsx --run
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add src/domain/sleepPlans.ts src/domain/sleepPlans.test.ts src/components/PlansPage.tsx src/components/PlansPage.test.tsx
git commit -m "feat: surface personalized seven day plan"
```

Only stage these four files.

## Task 5: Full Verification

**Files:**
- Verify all planned source and test files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- src/domain/personalization.test.ts src/components/ProfileWizard.test.tsx api/prompt.test.ts api/chat.test.ts src/domain/sleepPlans.test.ts src/components/PlansPage.test.tsx --run
```

Expected: PASS.

- [ ] **Step 2: Run full unit test suite**

Run:

```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run e2e smoke**

Run:

```bash
npm run e2e -- e2e/mvp.spec.ts
```

Expected: PASS for desktop and mobile projects. If Playwright reports a browser install problem, run the project’s existing Playwright browser install command and rerun this step.

- [ ] **Step 5: Inspect diff boundaries**

Run:

```bash
git status --short
git diff --stat
```

Expected: only files from this plan remain modified, plus any unrelated pre-existing user changes that were already present before implementation. Do not revert unrelated changes.

- [ ] **Step 6: Commit verification-only fixes if needed**

If verification requires a small test or type adjustment, stage only the affected planned files and commit:

```bash
git add <planned-file-paths>
git commit -m "test: verify personalized profile safety"
```

If no files changed after Task 4, skip this commit.
