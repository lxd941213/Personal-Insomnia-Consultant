import { getScenarioDefinition } from '../src/domain/scenarios';
import { formatPersonalizationForPrompt } from '../src/domain/personalization';
import { buildProgramContextForPrompt } from '../src/domain/program';
import type { AssessmentResult, ChatMessage, PersonalizedSleepProfile, ProgramPromptContext, SleepProfile, SleepScenario } from '../src/domain/types';

export function formatAssessmentContext(result: AssessmentResult): string {
  return `最近一次睡眠自测：
- ISI：${result.isi.score} 分（${result.isi.level}）
- PSQI-Lite：${result.psqiLite.score} 分（${result.psqiLite.level}）
- 风险标记：${result.riskFlags.join('、') || '无'}`;
}

export function buildSleepAdvisorPrompt(
  profile: SleepProfile,
  message: string,
  history: ChatMessage[] = [],
  assessmentResult?: AssessmentResult,
  scenario?: SleepScenario,
  personalization?: PersonalizedSleepProfile,
  programContext?: ProgramPromptContext,
): string {
  const recentHistory = history
    .slice(-6)
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n');

  const assessmentContext = assessmentResult ? `\n\n${formatAssessmentContext(assessmentResult)}` : '';
  const personalizationContext = personalization ? `\n\n${formatPersonalizationForPrompt(personalization)}` : '';
  const scenarioDefinition = scenario ? getScenarioDefinition(scenario) : undefined;
  const scenarioContext = scenarioDefinition
    ? `\n- 当前咨询场景：${scenarioDefinition.label}（${scenarioDefinition.description}）`
    : '';
  const programPromptContext = programContext ? `\n\n${buildProgramContextForPrompt(programContext)}` : '';

  return `
你是一位睡眠健康 AI 顾问，仅提供健康管理参考。
你不是医生，你的回答不是医疗诊断。

在回答之前，先判断用户的风险等级为"normal"或"high_risk"。
高风险信号包括：严重或长期失眠、自伤想法、疑似睡眠呼吸暂停、胸痛、药物依赖、孕期/产后严重睡眠问题、重大基础疾病。
对于高风险用户，优先建议专业就诊，不提供诊断、处方、药物剂量或强化干预指导。
如果提供了"个性化睡眠分析"，必须优先遵循其中的严重程度、就医建议和安全边界。
如果提供了"当前 14 天改善计划"，可以解释今日任务、提供更轻量替代动作、帮助用户复盘没做到的原因，但不能覆盖安全分流规则。
不得提供处方、具体药物剂量或补充剂剂量；涉及褪黑素、镁、色氨酸等补充剂时，只能建议咨询医生、药师或营养专业人士评估适用性。
如果用户要求计划，优先使用"7天改善计划"中的每日任务。

判断用户意图：
- 如果用户只是打招呼、闲聊、或询问"你能做什么"等开放式问题，请用自然对话的方式友好回应，在 summary 中写出完整回复，possibleFactors、suggestions、nextQuestions 留空数组。
- 如果用户在咨询具体的睡眠问题，请返回结构化的分析内容。

你必须用中文回答，返回符合以下格式的 JSON：
{
  "riskLevel": "normal",
  "summary": "简短总结或自然对话回复",
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
${scenarioContext}
${assessmentContext}
${personalizationContext}
${programPromptContext}
最近对话：
${recentHistory || '暂无历史消息'}

当前用户消息：
${message}
`;
}
