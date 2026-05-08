import type { SleepScenario } from './types';

export interface SleepScenarioDefinition {
  id: SleepScenario;
  label: string;
  description: string;
  keywords: string[];
  chatPrompt: string;
}

export const sleepScenarios: SleepScenarioDefinition[] = [
  {
    id: 'hard_to_fall_asleep',
    label: '入睡困难',
    description: '难以在合理时间内入睡，躺在床上辗转反侧',
    keywords: ['入睡困难', '失眠', '睡不着', '难以入睡'],
    chatPrompt:
      '你是一位睡眠健康专家。请根据用户的失眠症状（入睡困难），提供科学、通俗的睡眠改善知识卡片，包括：1) 可能的原因分析；2) 实用的改善建议；3) 需要就医的警示信号。',
  },
  {
    id: 'poor_sleep_quality',
    label: '睡眠质量差',
    description: '睡眠浅、容易醒、多梦等睡眠质量问题',
    keywords: ['睡眠质量', '浅睡眠', '多梦', '易醒', '睡眠片段化'],
    chatPrompt:
      '你是一位睡眠健康专家。请根据用户睡眠质量问题（浅睡眠、多梦、易醒等），提供科学、通俗的知识卡片，包括：1) 睡眠结构和周期基础知识；2) 提升睡眠质量的方法；3) 睡眠环境优化建议。',
  },
  {
    id: 'stress_anxiety',
    label: '压力焦虑',
    description: '因压力、焦虑等情绪问题导致失眠',
    keywords: ['压力', '焦虑', '情绪', '心理', '睡不着'],
    chatPrompt:
      '你是一位睡眠健康专家。请根据用户因压力焦虑导致的失眠问题，提供科学、通俗的知识卡片，包括：1) 压力与睡眠的关系；2) 放松和冥想技巧；3) 何时需要寻求专业心理帮助。',
  },
  {
    id: 'late_night_habit',
    label: '熬夜习惯',
    description: '刷手机、打游戏或工作拖到很晚，想减少熬夜损伤',
    keywords: ['晚睡', '熬夜', '生物钟', '作息紊乱'],
    chatPrompt:
      '你是一位睡眠健康专家。请根据用户的晚睡习惯问题，提供科学、通俗的睡眠改善知识卡片，包括：1) 晚睡对健康的长期影响；2) 如何逐步调整作息；3) 睡前避免的行为。',
  },
  {
    id: 'wellness_regulation',
    label: '养生调理',
    description: '希望改善整体睡眠质量和健康状态',
    keywords: ['养生', '调理', '保健', '整体改善', '健康'],
    chatPrompt:
      '你是一位睡眠健康专家。请为用户提供科学、通俗的睡眠养生知识卡片，包括：1) 日常饮食与睡眠的关系；2) 运动对睡眠的影响；3) 长期睡眠健康管理策略。',
  },
  {
    id: 'bedtime_ritual',
    label: '睡前仪式助手',
    description: '根据用户情况生成专属「睡前 30 分钟计划」',
    keywords: ['睡前仪式', '睡前计划', '睡前放松', '睡前30分钟', '睡前 30 分钟'],
    chatPrompt:
      '你是一位睡眠健康专家。请根据用户的个人情况和睡眠困扰，生成专属睡前 30 分钟计划，包括：1) 逐分钟或分阶段安排；2) 放松、环境、屏幕使用和饮水建议；3) 可持续执行的微习惯提醒；4) 需要停止计划并寻求专业帮助的警示信号。',
  },
  {
    id: 'sound_meditation',
    label: '白噪音 / 冥想音频',
    description: '雨声、海浪、脑波音乐、合规内嵌或外链',
    keywords: ['白噪音', '冥想音频', '雨声', '海浪', '脑波音乐', '助眠音乐'],
    chatPrompt:
      '你是一位睡眠健康专家。请围绕白噪音和冥想音频提供合规、实用的助眠建议，包括：1) 雨声、海浪、自然声、轻冥想或脑波音乐的适用人群；2) 音量、时长和播放设备建议；3) 如何选择合规内嵌内容或外部音频资源；4) 哪些情况下音频可能干扰睡眠。',
  },
  {
    id: 'medical_triage',
    label: '在线问诊导流',
    description: '严重失眠用户引导至合规医疗平台（商业合作）',
    keywords: ['在线问诊', '睡眠门诊', '严重失眠', '就医', '医生', '医疗平台'],
    chatPrompt:
      '你是一位睡眠健康顾问。请对可能严重失眠的用户进行谨慎的在线问诊导流说明，包括：1) 需要尽快就医或咨询睡眠门诊的信号；2) 如何准备病史、睡眠日志和用药信息；3) 合规医疗平台或线下医疗机构的选择原则；4) 明确说明本内容不替代医疗诊断。',
  },
  {
    id: 'diet_sleep_link',
    label: '饮食 × 睡眠关联',
    description: '分析用户饮食习惯与睡眠的关系，提供饮食调整建议',
    keywords: ['饮食', '咖啡因', '酒精', '晚餐', '睡眠关联', '饮食调整'],
    chatPrompt:
      '你是一位睡眠健康专家。请分析饮食习惯与睡眠之间的常见关系，并给出可执行调整建议，包括：1) 咖啡因、酒精、晚餐时间、辛辣或高糖食物对睡眠的影响；2) 适合睡前的饮食边界；3) 一周内可尝试的饮食调整计划；4) 需要营养师或医生评估的情况。',
  },
];

export function getScenarioDefinition(id: SleepScenario): SleepScenarioDefinition | undefined {
  return sleepScenarios.find((s) => s.id === id);
}

export function isSleepScenario(value: unknown): value is SleepScenario {
  return typeof value === 'string' && sleepScenarios.some((s) => s.id === value);
}

export function buildScenePrompt(scenarioId: SleepScenario): string {
  const scenario = getScenarioDefinition(scenarioId);
  if (!scenario) {
    return '请提供睡眠健康知识。';
  }
  return scenario.chatPrompt;
}
