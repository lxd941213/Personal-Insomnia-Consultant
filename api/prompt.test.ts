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

  it('includes current program context without full diary history', () => {
    const prompt = buildSleepAdvisorPrompt(
      profile,
      '为什么今天让我做这个任务？',
      [],
      undefined,
      undefined,
      undefined,
      {
        currentDay: 3,
        todayTask: {
          day: 3,
          title: '睡前手机边界',
          category: 'sleep_hygiene',
          evidenceLabel: '睡眠卫生',
          estimatedMinutes: 5,
          rationale: '减少睡前刺激。',
          action: '睡前 30 分钟停止刷短视频。',
          fallbackAction: '只保留低刺激内容。',
          safetyNote: null,
        },
        stats: {
          completedCount: 1,
          skippedCount: 1,
          completionRate: 50,
          currentStreak: 0,
          needsFallback: false,
        },
        safetyStatus: 'active',
      },
    );

    expect(prompt).toContain('当前 14 天改善计划');
    expect(prompt).toContain('睡前手机边界');
    expect(prompt).toContain('禁止覆盖安全分流规则');
    expect(prompt).not.toContain('完整睡眠日记');
  });

  it('includes recent diary summary without raw full diary history', () => {
    const prompt = buildSleepAdvisorPrompt(
      profile,
      '请结合最近睡眠情况给建议',
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      {
        entryCount: 2,
        daysWindow: 7,
        dateRange: { from: '2026-05-13', to: '2026-05-19' },
        averageSleepDurationMinutes: 330,
        averageSleepLatencyMinutes: 55,
        averageAwakenings: 2.5,
        averageSleepQuality: 2,
        recentFactors: ['睡前刷手机', '工作压力'],
        recentNotes: ['凌晨醒了几次'],
      },
    );

    expect(prompt).toContain('最近 7 天睡眠日记摘要');
    expect(prompt).toContain('记录天数：2');
    expect(prompt).toContain('平均睡眠时长：5小时30分钟');
    expect(prompt).toContain('平均入睡耗时：55分钟');
    expect(prompt).toContain('近期影响因素：睡前刷手机、工作压力');
    expect(prompt).toContain('近期备注：凌晨醒了几次');
    expect(prompt).not.toContain('完整睡眠日记');
  });

  it('requires structured, scenario-specific answers for scene chat', () => {
    const prompt = buildSleepAdvisorPrompt(
      profile,
      'hello，你能做什么',
      [],
      undefined,
      'bedtime_ritual',
    );

    expect(prompt).toContain('当前咨询场景：睡前仪式助手');
    expect(prompt).toContain('本次只围绕"睡前仪式助手"回答');
    expect(prompt).toContain('summary 只能写 1-2 句总览');
    expect(prompt).toContain('suggestions 必须给出睡前 30 分钟计划的分阶段安排');
    expect(prompt).toContain('不要把所有内容塞进 summary');
  });

  it('includes deterministic safety triage status and non-diagnostic boundaries', () => {
    const prompt = buildSleepAdvisorPrompt(
      profile,
      '我长期靠酒才能睡',
      [],
      undefined,
      undefined,
      undefined,
      {
        currentDay: 1,
        todayTask: {
          day: 1,
          title: '睡眠环境重置',
          category: 'sleep_hygiene',
          evidenceLabel: '睡眠卫生',
          estimatedMinutes: 10,
          rationale: '减少睡前刺激。',
          action: '调暗灯光。',
          fallbackAction: '只完成调暗灯光。',
          safetyNote: null,
        },
        stats: { completedCount: 0, skippedCount: 0, completionRate: 0, currentStreak: 0, needsFallback: false },
        safetyStatus: 'needs_care',
        safetyTriage: {
          level: 'urgent',
          reasons: ['存在助眠药物、镇静药或酒精依赖信号'],
          categories: ['medication_or_alcohol_dependence'],
          shouldBlockAi: true,
          careNotice: '请优先专业评估。',
        },
      },
      undefined,
      'user',
    );

    expect(prompt).toContain('确定性安全分诊：urgent');
    expect(prompt).toContain('禁止诊断');
    expect(prompt).toContain('禁止治疗承诺');
    expect(prompt).toContain('禁止处方');
    expect(prompt).toContain('禁止药物或补充剂剂量');
  });
});
