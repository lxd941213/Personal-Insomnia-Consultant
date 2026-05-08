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
