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
  'Your message includes signs that may need professional support. Please consider contacting a licensed clinician or mental health professional promptly. If you may harm yourself or someone else, contact emergency services now.';

export const defaultDisclaimer =
  'This is for health management reference only and is not medical diagnosis.';

export function detectHighRiskSignal(text: string): boolean {
  return highRiskPatterns.some((pattern) => pattern.test(text));
}
