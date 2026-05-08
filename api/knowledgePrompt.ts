import type { SleepProfile, SleepScenario, AssessmentResult } from '../src/domain/types';

export function buildKnowledgePrompt(
  profile: SleepProfile,
  scenario: SleepScenario,
  assessmentResult?: AssessmentResult,
): string {
  const scenarioDescriptions: Record<SleepScenario, string> = {
    hard_to_fall_asleep: '入睡困难',
    late_night_habit: '熬夜习惯',
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
    '任务：根据用户的睡眠档案、场景和评估结果，生成结构化知识卡片数组。\n' +
    '\n' +
    '要求：\n' +
    '1. 返回严格的中文 JSON 对象，格式如下：\n' +
    '{\n' +
    '  "scenario": "' + scenario + '",\n' +
    '  "generatedAt": "' + new Date().toISOString() + '",\n' +
    '  "cards": [\n' +
    '    {\n' +
    '      "title": "卡片标题",\n' +
    '      "summary": "简短解释",\n' +
    '      "keyPoints": ["要点"],\n' +
    '      "misconceptions": ["常见误区"],\n' +
    '      "actions": [{"title": "行动标题", "detail": "具体做法"}],\n' +
    '      "safetyNote": null,\n' +
    '      "followUpQuestions": ["可以继续问的问题"]\n' +
    '    }\n' +
    '  ],\n' +
    '  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。"\n' +
    '}\n' +
    '\n' +
    '2. cards 数组应包含 2-4 张知识卡片\n' +
    '3. 每张卡片应包含：\n' +
    '   - title: 简洁有力的标题（10-20字）\n' +
    '   - summary: 科学、通俗、实用的解释\n' +
    '   - keyPoints: 2-4 个关键要点\n' +
    '   - misconceptions: 1-3 个常见误区\n' +
    '   - actions: 1-3 个可执行建议\n' +
    '   - safetyNote: 可为 null；高风险时给出谨慎提示\n' +
    '   - followUpQuestions: 1-3 个后续问题\n' +
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
