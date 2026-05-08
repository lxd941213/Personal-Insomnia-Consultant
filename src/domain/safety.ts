const highRiskPatterns = [
  /hurt myself/i,
  /kill myself/i,
  /suicide/i,
  /self[- ]?harm/i,
  /stop breathing/i,
  /gasping/i,
  /chest pain/i,
  /pregnant/i,
  /postpartum/i,
  /sleeping pills every night/i,
  /cannot function/i,
];

export const defaultCareNotice =
  '您的消息中包含可能需要专业支持的信号，请考虑及时联系有执照的临床医生或心理健康专业人士。如果您可能伤害自己或他人，请立即联系紧急救援。';

export const defaultDisclaimer =
  '本内容仅提供健康管理参考，不作为医疗诊断。';

export function detectHighRiskSignal(text: string): boolean {
  return highRiskPatterns.some((pattern) => pattern.test(text));
}
