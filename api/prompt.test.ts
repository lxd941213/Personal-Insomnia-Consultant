import { describe, expect, it } from 'vitest';
import { buildSleepAdvisorPrompt } from './prompt';
import type { SleepProfile } from '../src/domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: ['Phone use before bed'],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: 'Mind keeps racing.',
};

describe('buildSleepAdvisorPrompt', () => {
  it('includes profile details and safety boundaries', () => {
    const prompt = buildSleepAdvisorPrompt(profile, 'How can I sleep earlier?');

    expect(prompt).toContain('25-34');
    expect(prompt).toContain('01:00');
    expect(prompt).toContain('不作为医疗诊断');
    expect(prompt).toContain('JSON');
  });

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
});