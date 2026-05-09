import type { AssessmentResult, DiarySummary, PersonalizedSleepProfile, SleepProfile } from './types';

interface BuildPersonalizationInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: DiarySummary | undefined;
}

function determineSeverity(input: BuildPersonalizationInput): PersonalizedSleepProfile['severity'] {
  const { profile, assessmentResult } = input;

  // Safety signals take precedence - severe
  const hasApneaSignal = profile.safetySignals?.some(
    (s) => s.includes('呼吸暂停') || s.includes('apnea')
  );
  const hasSelfHarmSignal = profile.safetySignals?.some(
    (s) => s.includes('自我伤害') || s.includes('自伤')
  );
  if (hasApneaSignal || hasSelfHarmSignal) return 'severe';

  // Check medical conditions for apnea indicators
  const hasApneaCondition = profile.medicalConditions?.some(
    (c) => c.includes('呼吸暂停') || c.includes('apnea')
  );
  if (hasApneaCondition) return 'severe';

  // Check assessment result
  if (assessmentResult) {
    if (assessmentResult.isi.level === 'severe') return 'severe';
    if (assessmentResult.isi.level === 'moderate') {
      // Moderate with chronic insomnia and daytime impact = moderate still
      return 'moderate';
    }
    if (assessmentResult.isi.level === 'mild') return 'mild';
    return 'low';
  }

  // Legacy profile without assessment - default to mild
  return 'mild';
}

function determineCareAdvice(input: BuildPersonalizationInput): PersonalizedSleepProfile['careAdvice'] {
  const { profile, assessmentResult } = input;
  const reasons: string[] = [];

  // Safety signals require urgent care
  const hasApneaSignal = profile.safetySignals?.some(
    (s) => s.includes('呼吸暂停') || s.includes('apnea')
  );
  const hasSelfHarmSignal = profile.safetySignals?.some(
    (s) => s.includes('自我伤害') || s.includes('自伤')
  );
  if (hasApneaSignal) {
    reasons.push('疑似睡眠呼吸暂停');
    return { shouldSeekCare: true, reasons, urgency: 'urgent' };
  }
  if (hasSelfHarmSignal) {
    reasons.push('自我伤害信号');
    return { shouldSeekCare: true, reasons, urgency: 'urgent' };
  }

  // Check medical conditions
  const hasApneaCondition = profile.medicalConditions?.some(
    (c) => c.includes('呼吸暂停') || c.includes('apnea')
  );
  if (hasApneaCondition) {
    reasons.push('疑似睡眠呼吸暂停');
    return { shouldSeekCare: true, reasons, urgency: 'urgent' };
  }

  // Chronic insomnia (>3 months) with daytime impairment
  const isChronic = profile.concernDuration === '3个月以上';
  const hasDaytimeImpact = profile.daytimeImpact && profile.daytimeImpact !== '无明显影响';
  if (isChronic && hasDaytimeImpact) {
    reasons.push('慢性失眠伴有日间功能损害');
    return { shouldSeekCare: true, reasons, urgency: 'soon' };
  }

  // Assessment-based recommendations
  if (assessmentResult) {
    if (assessmentResult.isi.level === 'severe') {
      reasons.push('失眠严重程度为重度');
      return { shouldSeekCare: true, reasons, urgency: 'urgent' };
    }
    if (assessmentResult.isi.level === 'moderate') {
      reasons.push('失眠严重程度为中度');
      return { shouldSeekCare: true, reasons, urgency: 'soon' };
    }
  }

  return { shouldSeekCare: false, reasons: [], urgency: 'routine' };
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