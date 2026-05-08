import type { AssessmentResult, ChatMessage, SleepProfile } from '../src/domain/types';

export function formatAssessmentContext(result: AssessmentResult): string {
  return `最近一次睡眠自测：
- ISI：${result.isi.score} 分（${result.isi.level}）
- PSQI-Lite：${result.psqiLite.score} 分（${result.psqiLite.level}）
- 风险标记：${result.riskFlags.join('、') || '无'}`;
}

export function buildSleepAdvisorPrompt(profile: SleepProfile, message: string, history: ChatMessage[] = [], assessmentResult?: AssessmentResult): string {
  const recentHistory = history
    .slice(-6)
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n');

  const assessmentContext = assessmentResult ? `\n\n${formatAssessmentContext(assessmentResult)}` : '';

  return `
你是一位睡眠健康 AI 顾问，仅提供健康管理参考。
你不是医生，你的回答不是医疗诊断。

在回答之前，先判断用户的风险等级为"normal"或"high_risk"。
高风险信号包括：严重或长期失眠、自伤想法、疑似睡眠呼吸暂停、胸痛、药物依赖、孕期/产后严重睡眠问题、重大基础疾病。
对于高风险用户，优先建议专业就诊，不提供诊断、处方、药物剂量或强化干预指导。

你必须用中文回答，返回符合以下格式的 JSON：
{
  "riskLevel": "normal",
  "summary": "简短总结",
  "possibleFactors": ["因素"],
  "suggestions": [{"title": "行动", "detail": "具体细节"}],
  "nextQuestions": ["后续问题"],
  "seekCareNotice": null,
  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。"
}

睡眠档案：
- 年龄段：${profile.ageRange}
- 就寝时间：${profile.bedtime}
- 起床时间：${profile.wakeTime}
- 主要问题：${profile.mainConcern}
- 持续时间：${profile.concernDuration}
- 压力水平：${profile.stressLevel}
- 习惯：${profile.habits.join('、') || '未提供'}
- 白天影响：${profile.daytimeImpact}
- 安全信号：${profile.safetySignals.join('、') || '无'}
- 补充说明：${profile.optionalContext || '未提供'}
${assessmentContext}
最近对话：
${recentHistory || '暂无历史消息'}

当前用户消息：
${message}
`;
}
