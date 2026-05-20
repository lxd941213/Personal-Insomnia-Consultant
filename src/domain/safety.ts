import type { SafetyTriageCategory, SafetyTriageInput, SafetyTriageResult, SafetyDisplayCopy } from './types';

type Rule = {
  category: SafetyTriageCategory;
  reason: string;
  urgent: RegExp[];
  needsCare: RegExp[];
};

const urgentCareNotice =
  '你的描述包含可能需要立即专业支持的信号。若存在伤害自己、胸痛、呼吸困难或其他急性危险，请立即联系当地急救电话，前往就近急诊或精神心理急诊，并请身边可信任的人陪伴。';

const needsCareNotice =
  '你的情况可能需要专业评估。建议联系当地心理援助或危机干预热线、睡眠门诊、呼吸科、心内科、精神心理科、产科或其他相关科室，根据症状选择合适帮助。';

export const defaultCareNotice = needsCareNotice;

export const defaultDisclaimer =
  '本内容仅提供健康管理参考，不作为医疗诊断。';

const rules: Rule[] = [
  {
    category: 'self_harm',
    reason: '存在自伤或轻生相关表达',
    urgent: [/轻生|不想活|想死|自杀|伤害自己|结束生命|hurt myself|kill myself|suicide|self[- ]?harm/i],
    needsCare: [],
  },
  {
    category: 'chest_pain_or_breathing',
    reason: '存在胸痛、胸闷或呼吸困难信号',
    urgent: [/胸痛|胸口痛|胸闷|呼吸困难|喘不上气|chest pain|shortness of breath/i],
    needsCare: [],
  },
  {
    category: 'sleep_apnea',
    reason: '存在疑似睡眠呼吸暂停或憋醒信号',
    urgent: [/憋醒.*(无法|白天|困|头痛|工作|学习)|呼吸暂停.*(白天|困|无法|头痛)|stop breathing|gasping/i],
    needsCare: [/憋醒|呼吸暂停|睡觉喘不上气|打鼾很严重|鼾声很大|疑似睡眠呼吸暂停|apnea/i],
  },
  {
    category: 'medication_or_alcohol_dependence',
    reason: '存在助眠药物、镇静药或酒精依赖信号',
    urgent: [/每天.*(安眠药|助眠药|镇静药)|每晚.*(靠药|吃药|喝酒)|长期.*(安眠药|助眠药)|靠酒才能睡|sleeping pills every night/i],
    needsCare: [/长期使用助眠药|药物依赖|正在服用其他药物|夜间饮酒/i],
  },
  {
    category: 'pregnancy_or_postpartum',
    reason: '孕期或产后睡眠问题需要专业评估',
    urgent: [/孕期.*严重.*睡不着|产后.*严重.*失眠|pregnant|postpartum/i],
    needsCare: [/孕期|产后|孕期或产后/i],
  },
  {
    category: 'severe_insomnia_impairment',
    reason: '严重失眠伴明显日间功能损害',
    urgent: [/无法工作|无法学习|无法生活|撑不住|cannot function/i],
    needsCare: [/白天.*(严重|明显).*(影响|疲惫|困)|慢性失眠|3个月以上/i],
  },
  {
    category: 'major_medical_condition',
    reason: '存在重大基础疾病或慢性病相关信号',
    urgent: [],
    needsCare: [/重大基础疾病|慢性病|疼痛/i],
  },
];

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function collectText(input: SafetyTriageInput): string {
  const profile = input.profile;
  return [
    input.message ?? '',
    profile?.daytimeImpact ?? '',
    profile?.optionalContext ?? '',
    ...(profile?.safetySignals ?? []),
    ...(profile?.medicalConditions ?? []),
    ...(profile?.medicationStatus ?? []),
    ...(input.diaryNotes ?? []),
  ].join(' ');
}

export function triageSafety(input: SafetyTriageInput): SafetyTriageResult {
  const text = collectText(input);
  const categories: SafetyTriageCategory[] = [];
  const reasons: string[] = [];
  let urgent = false;

  for (const rule of rules) {
    const urgentMatch = rule.urgent.some((pattern) => pattern.test(text));
    const needsCareMatch = rule.needsCare.some((pattern) => pattern.test(text));
    if (urgentMatch || needsCareMatch) {
      categories.push(rule.category);
      reasons.push(rule.reason);
    }
    if (urgentMatch) urgent = true;
  }

  if (input.assessmentResult?.isi.level === 'severe' && /无法|工作|学习|生活|白天|疲惫|困/.test(text)) {
    categories.push('severe_insomnia_impairment');
    reasons.push('重度失眠伴明显日间影响');
    urgent = true;
  }

  const finalCategories = unique(categories);
  const finalReasons = unique(reasons);
  const level = urgent ? 'urgent' : finalCategories.length > 0 ? 'needs_care' : 'normal';

  return {
    level,
    reasons: finalReasons,
    categories: finalCategories,
    shouldBlockAi: level === 'urgent',
    careNotice: level === 'urgent' ? urgentCareNotice : level === 'needs_care' ? needsCareNotice : null,
  };
}

export function detectHighRiskSignal(text: string): boolean {
  return triageSafety({ message: text }).shouldBlockAi;
}

export function buildSafetyDisplayCopy(result: SafetyTriageResult): SafetyDisplayCopy {
  if (result.level === 'urgent') {
    return {
      title: '请立即优先处理安全风险',
      summary: result.careNotice ?? urgentCareNotice,
      actions: [
        { label: '联系当地急救', detail: '如果存在自伤危险、胸痛、呼吸困难或其他急性危险，请立即联系当地急救电话。' },
        { label: '前往线下急诊', detail: '可以前往就近急诊、精神心理急诊，或根据症状选择呼吸科、心内科、产科等线下帮助。' },
        { label: '让可信任的人陪伴', detail: '在风险没有解除前，请尽量让家人、朋友、同事或身边可信任的人陪在附近。' },
      ],
      disclaimer: defaultDisclaimer,
    };
  }

  if (result.level === 'needs_care') {
    return {
      title: '建议专业评估后再执行普通助眠任务',
      summary: result.careNotice ?? needsCareNotice,
      actions: [
        { label: '整理睡眠记录', detail: '记录入睡时间、夜醒、憋醒、用药或饮酒情况、白天功能影响，便于专业人员判断。' },
        { label: '选择合适科室', detail: '可根据症状考虑睡眠门诊、呼吸科、心内科、精神心理科、产科或其他相关科室。' },
        { label: '保守管理', detail: '在评估前，只进行温和的睡眠记录、环境调整和低强度放松，不做激烈干预。' },
      ],
      disclaimer: `${defaultDisclaimer} 如症状加重或出现急性危险，请优先线下就医或急救。`,
    };
  }

  return {
    title: '睡眠健康管理参考',
    summary: '当前未识别到需要优先阻断的高风险信号，可以继续进行睡眠记录、科普学习和保守助眠任务。',
    actions: [
      { label: '继续记录', detail: '记录入睡耗时、夜醒次数、睡眠质量和白天状态，避免过早判断趋势。' },
      { label: '温和调整', detail: '优先尝试固定起床时间、减少睡前刺激、放松练习和卧室环境调整。' },
    ],
    disclaimer: defaultDisclaimer,
  };
}