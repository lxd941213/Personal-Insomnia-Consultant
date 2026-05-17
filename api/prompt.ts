import { getScenarioDefinition } from '../src/domain/scenarios';
import { formatPersonalizationForPrompt } from '../src/domain/personalization';
import { buildProgramContextForPrompt } from '../src/domain/program';
import type { AssessmentResult, ChatMessage, PersonalizedSleepProfile, ProgramPromptContext, SleepProfile, SleepScenario } from '../src/domain/types';

const scenarioResponseGuidance: Record<SleepScenario, string> = {
  hard_to_fall_asleep:
    'possibleFactors 聚焦入睡前认知唤醒、作息漂移、床与清醒的关联；suggestions 必须给出今晚可执行的入睡准备、刺激控制或放松步骤。',
  poor_sleep_quality:
    'possibleFactors 聚焦夜间易醒、睡眠片段化、环境干扰和睡眠结构；suggestions 必须给出减少觉醒、优化卧室环境和醒后处理的具体方法。',
  stress_anxiety:
    'possibleFactors 聚焦压力、焦虑、反刍思维和身体紧绷；suggestions 必须给出降唤醒、情绪卸载、呼吸或放松练习，不要泛泛谈作息。',
  late_night_habit:
    'possibleFactors 聚焦熬夜触发点、屏幕/工作/游戏延迟和生物钟后移；suggestions 必须给出逐步提前作息、睡前屏幕边界和替代行为。',
  wellness_regulation:
    'possibleFactors 聚焦长期生活方式、运动、饮食和恢复节律；suggestions 必须给出温和、可持续的养生调理动作，并明确不替代医疗或中医诊断。',
  bedtime_ritual:
    'suggestions 必须给出睡前 30 分钟计划的分阶段安排，例如 T-30、T-20、T-10、上床前；内容聚焦放松、环境、屏幕边界和可持续微习惯。',
  sound_meditation:
    'possibleFactors 聚焦声音刺激、环境噪声、注意力难以下降；suggestions 必须给出音频类型、音量、时长、设备摆放和不适用情况。',
  medical_triage:
    'possibleFactors 聚焦严重程度、持续时间、白天功能受损和安全信号；suggestions 必须优先给出就医准备、睡眠日志、问诊材料和合规导流原则。',
  diet_sleep_link:
    'possibleFactors 聚焦咖啡因、酒精、晚餐时间、辛辣高糖和夜间胃肠负担；suggestions 必须给出一周内可尝试的饮食边界和调整步骤。',
};

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
  mode?: 'standalone' | 'user',
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
  const scenarioSystemPrompt = scenarioDefinition
    ? `\n\n场景角色指导：${scenarioDefinition.chatPrompt}

场景输出规则：
- 本次只围绕"${scenarioDefinition.label}"回答；如果用户只是打招呼或问"你能做什么"，也只介绍这个模块能提供的帮助，不要切回通用睡眠质量建议。
- ${scenarioResponseGuidance[scenarioDefinition.id]}
- summary 只能写 1-2 句总览，不要把所有内容塞进 summary。
- possibleFactors 写 2-4 个短点；suggestions 写 3-5 个可执行动作；nextQuestions 写 1-3 个用于继续追问的短问题。
- 不要在 JSON 字符串里使用 Markdown 序号、加粗标记或整段长文。`
    : '';
  const programPromptContext = programContext ? `\n\n${buildProgramContextForPrompt(programContext)}` : '';

  const baseInstructions = `
在回答之前，先判断用户的风险等级为"normal"或"high_risk"。
高风险信号包括：严重或长期失眠、自伤想法、疑似睡眠呼吸暂停、胸痛、药物依赖、孕期/产后严重睡眠问题、重大基础疾病。
对于高风险用户，优先建议专业就诊，不提供诊断、处方、药物剂量或强化干预指导。
如果提供了"个性化睡眠分析"，必须优先遵循其中的严重程度、就医建议和安全边界。
如果提供了"当前 14 天改善计划"，可以解释今日任务、提供更轻量替代动作、帮助用户复盘没做到的原因，但不能覆盖安全分流规则。
不得提供处方、具体药物剂量或补充剂剂量；涉及褪黑素、镁、色氨酸等补充剂时，只能建议咨询医生、药师或营养专业人士评估适用性。
如果用户要求计划，优先使用"7天改善计划"中的每日任务。

判断用户意图：
- 如果用户只是打招呼、闲聊、或询问"你能做什么"等开放式问题，请用自然对话的方式友好回应，在 summary 中写出完整回复，possibleFactors、suggestions、nextQuestions 留空数组。
- 如果提供了"当前咨询场景"，即使用户只是打招呼或问"你能做什么"，也要围绕当前场景说明能提供的帮助，并优先把具体能力放入 suggestions，而不是写成一整段。
- 如果用户在咨询具体的睡眠问题，请返回结构化的分析内容。
- 对非闲聊回答，summary 只能写 1-2 句，possibleFactors、suggestions、nextQuestions 必须分字段填写；不要把所有内容塞进 summary。

你必须用中文回答，返回符合以下格式的 JSON：
{
  "riskLevel": "normal",
  "summary": "1-2句总览，不写长段落",
  "possibleFactors": ["短点1", "短点2"],
  "suggestions": [{"title": "动作标题", "detail": "一到两句具体做法"}],
  "nextQuestions": ["继续追问的问题"],
  "seekCareNotice": null,
  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。"
}`;

  const contextSection = `
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
${scenarioSystemPrompt}
${assessmentContext}
${personalizationContext}
${programPromptContext}
最近对话：
${recentHistory || '暂无历史消息'}

当前用户消息：
${message}
`;

  if (mode === 'user') {
    return `${baseInstructions}${contextSection}`;
  }

  return `
你是一位睡眠健康 AI 顾问，仅提供健康管理参考。
你不是医生，你的回答不是医疗诊断。
${baseInstructions}
${contextSection}`;
}
