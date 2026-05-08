import type { SleepProfile, SleepScenario, AssessmentResult } from '../src/domain/types';

export function buildKnowledgePrompt(
  profile: SleepProfile,
  scenario: SleepScenario,
  assessmentResult?: AssessmentResult,
): string {
  const scenarioDescriptions: Record<SleepScenario, string> = {
    hard_to_fall_asleep: '入睡困难',
    late_night_habit: '晚睡习惯',
    stress_anxiety: '压力焦虑',
    poor_sleep_quality: '睡眠质量差',
    wellness_regulation: '养生调理',
  };

  const scenarioDesc = scenarioDescriptions[scenario] || '睡眠健康';

  let assessmentContext = '';
  if (assessmentResult) {
    const isiLevel = assessmentResult.isi.level;
    const psqiLevel = assessmentResult.psqiLite.level;
    let riskFlagsLine = '';
    if (assessmentResult.riskFlags.length > 0) {
      riskFlagsLine = '\n- 风险信号：' + assessmentResult.riskFlags.join('、');
    }
    assessmentContext =
      '\n用户评估结果：\n' +
      '- 失眠严重程度指数（ISI）：' +
      assessmentResult.isi.score +
      '分，' +
      isiLevel +
      '级别\n' +
      '- 睡眠质量指数（PSQI）：' +
      assessmentResult.psqiLite.score +
      '分，' +
      psqiLevel +
      '级别' +
      riskFlagsLine;
  }

  const prompt =
    '你是一位睡眠健康专家，擅长提供科学、通俗的健康管理建议。\n' +
    '\n' +
    '你必须用中文回答。\n' +
    '\n' +
    '任务：根据用户的睡眠档案、场景和评估结果，生成知识卡片数组。\n' +
    '\n' +
    '要求：\n' +
    '1. 返回严格的中文 JSON 对象，格式如下：\n' +
    '{\n' +
    '  "cards": [\n' +
    '    {\n' +
    '      "scenario": "场景ID",\n' +
    '      "title": "卡片标题",\n' +
    '      "content": "卡片内容（100-300字）",\n' +
    '      "tags": ["标签1", "标签2", "标签3"]\n' +
    '    }\n' +
    '  ],\n' +
    '  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。"\n' +
    '}\n' +
    '\n' +
    '2. cards 数组应包含 2-4 张知识卡片\n' +
    '3. 每张卡片应包含：\n' +
    '   - scenario: 必须与输入的场景一致\n' +
    '   - title: 简洁有力的标题（10-20字）\n' +
    '   - content: 科学、通俗、实用的内容（100-300字）\n' +
    '   - tags: 3-5 个相关标签\n' +
    '\n' +
    '4. 内容应该：\n' +
    '   - 解释问题的原因和影响\n' +
    '   - 提供实用的改善建议\n' +
    '   - 包含需要就医的警示信号\n' +
    assessmentContext +
    '\n' +
    '用户睡眠档案：\n' +
    '- 年龄段：' +
    profile.ageRange +
    '\n' +
    '- 就寝时间：' +
    profile.bedtime +
    '\n' +
    '- 起床时间：' +
    profile.wakeTime +
    '\n' +
    '- 主要问题：' +
    profile.mainConcern +
    '\n' +
    '- 持续时间：' +
    profile.concernDuration +
    '\n' +
    '- 压力水平：' +
    profile.stressLevel +
    '\n' +
    '- 习惯：' +
    (profile.habits.join('、') || '未提供') +
    '\n' +
    '- 白天影响：' +
    profile.daytimeImpact +
    '\n' +
    '- 安全信号：' +
    (profile.safetySignals.join('、') || '无') +
    '\n' +
    '- 补充说明：' +
    (profile.optionalContext || '未提供') +
    '\n' +
    '\n' +
    '当前场景：' +
    scenarioDesc +
    '\n' +
    '\n' +
    '请生成 JSON：';

  return prompt;
}