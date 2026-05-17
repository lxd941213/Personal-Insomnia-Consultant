export interface AiProviderResult {
  content: string;
}

function resolveChatCompletionsUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (url.pathname === '/v1' || url.pathname === '/v1/') {
    url.pathname = '/v1/chat/completions';
  } else if (url.pathname === '/api/v1' || url.pathname === '/api/v1/') {
    url.pathname = '/api/v1/chat/completions';
  }
  return url.toString();
}

function buildPromptMessages(prompt: string): Array<{ role: 'system' | 'user'; content: string }> {
  const systemPrompt = `你是一位睡眠健康 AI 顾问，仅提供健康管理参考。
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
}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];
}

export async function callAiProvider(prompt: string): Promise<AiProviderResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('AI_API_KEY is required');
  }

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:') {
      throw new Error('AI_BASE_URL must use HTTPS');
    }
  } catch {
    throw new Error('Invalid AI_BASE_URL');
  }

  const response = await fetch(resolveChatCompletionsUrl(baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: buildPromptMessages(prompt),
      temperature: 0.3,
      reasoning_split: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider failed with ${response.status}`);
  }

  const json = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('AI provider returned no text content');
  }

  return { content };
}
