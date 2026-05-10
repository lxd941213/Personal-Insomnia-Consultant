import type { AssessmentResult, DiarySummary, PersonalizedSleepProfile, SleepProfile } from './types';

interface BuildPersonalizationInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: DiarySummary | undefined;
}

function signals(profile: SleepProfile): string[] {
  return [
    ...profile.safetySignals,
    ...(profile.emotionState ?? []),
    ...(profile.medicationStatus ?? []),
    ...(profile.medicalConditions ?? []),
    profile.daytimeImpact,
    profile.optionalContext,
  ].filter(Boolean);
}

function includesAny(values: string[], patterns: string[]): boolean {
  return values.some((value) => patterns.some((pattern) => value.includes(pattern)));
}

function hasDaytimeImpairment(profile: SleepProfile): boolean {
  return /疲惫|嗜睡|功能|工作|学习|影响|无法|困倦/.test(profile.daytimeImpact);
}

function hasShortSleep(input: BuildPersonalizationInput): boolean {
  const profileHours = Number(input.profile.sleepDurationHours);
  const profileShort = Number.isFinite(profileHours) && profileHours > 0 && profileHours < 5;
  const diaryShort = typeof input.diarySummary?.averageSleepDurationMinutes === 'number'
    && input.diarySummary.averageSleepDurationMinutes < 300;
  return profileShort || diaryShort;
}

function careReasons(input: BuildPersonalizationInput): string[] {
  const { profile, assessmentResult } = input;
  const allSignals = signals(profile);
  const reasons: string[] = [];

  if (includesAny(allSignals, ['自我伤害', '自伤', '轻生', '伤害自己'])) {
    reasons.push('存在自伤或严重情绪风险信号');
  }
  if (includesAny(allSignals, ['呼吸暂停', '憋醒', 'apnea'])) {
    reasons.push('疑似睡眠呼吸暂停');
  }
  if (includesAny(allSignals, ['胸痛', '重大基础疾病', '慢性病'])) {
    reasons.push('存在基础疾病或胸痛相关信号');
  }
  if (includesAny(allSignals, ['孕期', '产后'])) {
    reasons.push('孕期或产后睡眠问题需要谨慎评估');
  }
  if (includesAny(allSignals, ['药物依赖', '长期使用助眠药', '每晚使用', '长期用药'])) {
    reasons.push('存在助眠药物依赖或长期用药信号');
  }
  profile.safetySignals
    .filter((signal) => signal && !reasons.some((reason) => reason.includes(signal)))
    .forEach((signal) => reasons.push(`存在安全信号：${signal}`));
  if (assessmentResult?.isi.level === 'severe') {
    reasons.push('失眠严重程度为重度');
  }
  if (assessmentResult?.psqiLite.level === 'poor' && hasDaytimeImpairment(profile)) {
    reasons.push('睡眠质量较差且影响白天功能');
  }
  if (profile.concernDuration === '3个月以上' && hasDaytimeImpairment(profile)) {
    reasons.push('慢性失眠伴有日间功能损害');
  }
  if (hasShortSleep(input) && hasDaytimeImpairment(profile)) {
    reasons.push('睡眠时长明显不足且伴随白天影响');
  }

  return Array.from(new Set(reasons));
}

function determineSeverity(input: BuildPersonalizationInput): PersonalizedSleepProfile['severity'] {
  const { profile, assessmentResult } = input;
  const reasons = careReasons(input);
  const severeReasons = reasons.filter((reason) =>
    !reason.includes('睡眠时长明显不足') && !reason.includes('慢性失眠伴有日间功能损害'),
  );

  if (severeReasons.length > 0) return 'severe';
  if (
    assessmentResult?.isi.level === 'moderate' ||
    assessmentResult?.psqiLite.level === 'poor' ||
    reasons.length > 0 ||
    hasShortSleep(input)
  ) {
    return 'moderate';
  }
  if (
    assessmentResult?.isi.level === 'mild' ||
    profile.concernDuration === '1-3个月' ||
    profile.stressLevel === '很高' ||
    profile.stressLevel === '较高' ||
    profile.habits.length > 0 ||
    (profile.dietHabit ?? []).length > 0
  ) {
    return 'mild';
  }

  return 'low';
}

function determineCareAdvice(input: BuildPersonalizationInput): PersonalizedSleepProfile['careAdvice'] {
  const reasons = careReasons(input);
  if (reasons.length === 0) return { shouldSeekCare: false, reasons: [], urgency: 'routine' };

  const urgent = reasons.some((reason) =>
    reason.includes('自伤') ||
    reason.includes('呼吸暂停') ||
    reason.includes('胸痛') ||
    reason.includes('孕期') ||
    reason.includes('重度') ||
    reason.includes('药物依赖') ||
    reason.includes('安全信号'),
  );

  return { shouldSeekCare: true, reasons, urgency: urgent ? 'urgent' : 'soon' };
}

function determineTcmPattern(profile: SleepProfile): PersonalizedSleepProfile['tcmDirection'] {
  const stressHigh = profile.stressLevel === '很高' || profile.stressLevel === '较高';
  const hasAnxiety = profile.emotionState?.some(
    (e) => e.includes('焦虑') || e.includes('烦躁') || e.includes('易怒')
  );
  const hasYinDeficiency = profile.emotionState?.some(
    (e) => e.includes('盗汗') || e.includes('潮热') || e.includes('心烦')
  );

  let pattern: PersonalizedSleepProfile['tcmDirection']['pattern'] = 'unclear';
  let label = '体质倾向不明确';
  const guidance: string[] = [];

  if (stressHigh && hasAnxiety) {
    pattern = 'liver_qi_stagnation';
    label = '肝郁气滞体质倾向';
    guidance.push('疏肝解郁，调畅情志');
    guidance.push('宜食用玫瑰花、陈皮、菊花等疏肝食材');
    guidance.push('建议进行八段锦、太极拳等舒缓运动');
  } else if (hasYinDeficiency) {
    pattern = 'yin_deficiency';
    label = '阴虚体质倾向';
    guidance.push('滋阴清热，养心安神');
    guidance.push('宜食用百合、莲子、银耳等滋阴食材');
    guidance.push('避免辛辣刺激性食物');
  } else if (profile.sleepDurationHours && parseFloat(profile.sleepDurationHours) < 6) {
    pattern = 'qi_deficiency';
    label = '气虚体质倾向';
    guidance.push('补气养心，健脾益肺');
    guidance.push('宜食用山药、红枣、桂圆等补气食材');
    guidance.push('适量进行温和运动如散步、慢跑');
  } else {
    pattern = 'balanced';
    label = '体质相对平衡';
    guidance.push('以养生调摄为主');
    guidance.push('保持规律作息');
    guidance.push('适度运动，舒畅情志');
  }

  return {
    pattern,
    label,
    guidance,
    disclaimer: '本分析仅供参考，不作为医疗诊断依据',
  };
}

function buildBehaviorTargets(profile: SleepProfile): string[] {
  const targets: string[] = [];

  // Sleep hygiene basics
  targets.push('建立规律作息时间');
  targets.push('固定入睡和起床时间');

  // Phone usage
  if (profile.phoneUsageHabit?.includes('频繁') || profile.habits?.includes('睡前玩手机')) {
    targets.push('睡前1小时内避免使用手机');
    targets.push('将手机放置于卧室外充电');
  }

  // Late bedtime
  if (profile.bedtime && profile.bedtime > '00:30') {
    targets.push('逐步提前入睡时间，每周提前15-30分钟');
  }

  // Caffeine
  if (profile.dietHabit?.includes('午后咖啡因')) {
    targets.push('下午2点后避免摄入咖啡因');
  }

  // Late dinner
  if (profile.dietHabit?.includes('晚餐过晚') || profile.dietHabit?.includes('晚餐过饱')) {
    targets.push('睡前2-3小时避免进食');
  }

  return [...new Set(targets)];
}

function buildRelaxationTargets(profile: SleepProfile): string[] {
  const targets: string[] = [];

  targets.push('腹式呼吸放松训练');

  const stressHigh = profile.stressLevel === '很高' || profile.stressLevel === '较高';
  if (stressHigh || profile.emotionState?.some((e) => e.includes('焦虑'))) {
    targets.push('渐进性肌肉放松练习');
    targets.push('5-10分钟正念冥想');
  }

  // Vivid dreams or frequent waking
  if (profile.mainConcern === 'vivid_dreams' || profile.mainConcern === 'frequent_waking') {
    targets.push('梦境记录与情绪梳理');
  }

  return targets;
}

function buildNutritionTargets(profile: SleepProfile): string[] {
  const targets: string[] = [];

  targets.push('睡前可适量饮用温热牛奶');

  // Melatonin supportive foods
  targets.push('食用含褪黑素食物如酸樱桃、香蕉、核桃');

  if (profile.dietHabit?.includes('午后咖啡因')) {
    targets.push('避免下午摄入咖啡、茶、奶茶等');
  }

  if (profile.dietHabit?.includes('晚餐过晚') || profile.dietHabit?.includes('晚餐过饱')) {
    targets.push('晚餐宜清淡，睡前避免油腻食物');
  }

  // Medication interactions
  if (profile.medicationStatus && profile.medicationStatus.length > 0) {
    targets.push('使用任何助眠补充剂前请咨询医生');
  }

  return [...new Set(targets)];
}

function buildExerciseTargets(profile: SleepProfile): string[] {
  const targets: string[] = [];

  const hasExerciseHabit = profile.exerciseHabit && profile.exerciseHabit !== '无';
  if (hasExerciseHabit) {
    targets.push('坚持规律运动习惯');
  } else {
    targets.push('开始培养轻度运动习惯');
  }

  targets.push('建议每周3-5次有氧运动如快走、慢跑、游泳');
  targets.push('睡前2小时内避免剧烈运动');

  return targets;
}

function buildSevenDayPlan(_profile: SleepProfile): PersonalizedSleepProfile['sevenDayPlan'] {
  const days = [
    {
      day: 1,
      title: '睡眠环境优化',
      task: '评估并改善卧室环境：确保卧室黑暗、安静、温度适宜（18-22°C）。移除卧室中的电子设备，尤其是电视和电脑。',
      checkInPrompt: '今天你做了什么来改善睡眠环境？睡眠质量有改善吗？',
    },
    {
      day: 2,
      title: '作息规律建立',
      task: '设定并坚持固定的就寝和起床时间，即使是周末也不例外。避免白天过长的午睡（不超过30分钟）。',
      checkInPrompt: '今天按时起床和就寝了吗？感觉精神状态如何？',
    },
    {
      day: 3,
      title: '晚间放松仪式',
      task: '建立睡前放松习惯：如温水泡脚、阅读轻松的书籍、听舒缓音乐。避免在床上刷手机或看刺激内容。',
      checkInPrompt: '睡前做了什么放松活动？感觉入睡是否更容易？',
    },
    {
      day: 4,
      title: '饮食与运动调整',
      task: '注意晚餐时间和内容，避免睡前3小时进食。避免下午摄入咖啡因。如有条件，进行30分钟适度运动。',
      checkInPrompt: '今天的饮食和运动情况如何？有没有避免咖啡因？',
    },
    {
      day: 5,
      title: '认知与情绪管理',
      task: '实践放松技术：腹式呼吸或渐进性肌肉放松。如果脑子乱，尝试写日记把烦恼写下来。',
      checkInPrompt: '今天尝试了哪些放松技术？效果如何？',
    },
    {
      day: 6,
      title: '日间活动优化',
      task: '保证足够的日光照射，有助于调整生物钟。避免在白天长时间躺卧。增加日间活动量和社交互动。',
      checkInPrompt: '今天白天的活动量如何？有没有接受足够的光照？',
    },
    {
      day: 7,
      title: '总结与展望',
      task: '回顾一周的睡眠记录，评估哪些措施有效。继续坚持有效的策略，并计划下周的重点改善方向。',
      checkInPrompt: '这一周睡眠总体改善情况如何？哪些方法对你最有效？',
    },
  ];

  return days;
}

function buildSafetyBoundaries(): string[] {
  return [
    '本内容仅供参考，非医疗诊断',
    '不提供药物或补充剂剂量',
    '如症状持续或加重，请及时就医',
    '本建议不能替代专业医疗评估',
  ];
}

export function buildPersonalizationProfile(input: BuildPersonalizationInput): PersonalizedSleepProfile {
  const { profile } = input;

  return {
    severity: determineSeverity(input),
    careAdvice: determineCareAdvice(input),
    behaviorTargets: buildBehaviorTargets(profile),
    relaxationTargets: buildRelaxationTargets(profile),
    nutritionTargets: buildNutritionTargets(profile),
    exerciseTargets: buildExerciseTargets(profile),
    tcmDirection: determineTcmPattern(profile),
    sevenDayPlan: buildSevenDayPlan(profile),
    safetyBoundaries: buildSafetyBoundaries(),
  };
}

export function formatPersonalizationForPrompt(personalized: PersonalizedSleepProfile): string {
  const lines: string[] = [];

  lines.push('=== 个性化睡眠分析 ===');
  lines.push(`严重程度：${personalized.severity}`);
  lines.push('');

  if (personalized.careAdvice.shouldSeekCare) {
    lines.push(`护理建议：需要寻求专业帮助（${personalized.careAdvice.urgency}）`);
    if (personalized.careAdvice.reasons.length > 0) {
      lines.push(`原因：${personalized.careAdvice.reasons.join('、')}`);
    }
    lines.push('');
  }

  lines.push('--- 行为建议 ---');
  personalized.behaviorTargets.forEach((t) => lines.push(`- ${t}`));
  lines.push('');

  lines.push('--- 放松训练 ---');
  personalized.relaxationTargets.forEach((t) => lines.push(`- ${t}`));
  lines.push('');

  lines.push('--- 营养指导 ---');
  personalized.nutritionTargets.forEach((t) => lines.push(`- ${t}`));
  lines.push('');

  lines.push('--- 运动建议 ---');
  personalized.exerciseTargets.forEach((t) => lines.push(`- ${t}`));
  lines.push('');

  lines.push('--- 中医体质参考 ---');
  lines.push(`体质类型：${personalized.tcmDirection.label}`);
  personalized.tcmDirection.guidance.forEach((g) => lines.push(`- ${g}`));
  lines.push('');

  lines.push('--- 7天改善计划 ---');
  personalized.sevenDayPlan.forEach((day) => {
    lines.push(`第${day.day}天：${day.title}`);
    lines.push(`  任务：${day.task}`);
  });
  lines.push('');

  lines.push('--- 安全提示 ---');
  personalized.safetyBoundaries.forEach((b) => lines.push(`* ${b}`));

  return lines.join('\n');
}
