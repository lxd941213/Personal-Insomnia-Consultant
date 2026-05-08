import type { SleepProfile, SleepScenario, AssessmentResult } from '../src/domain/types';
import { detectHighRiskSignal } from '../src/domain/safety';
import { isSleepScenario } from '../src/domain/scenarios';
import { normalizeKnowledgeResponse, fallbackKnowledgeResponse } from '../src/domain/knowledge';
import { buildKnowledgePrompt } from './knowledgePrompt';
import { callAiProvider } from './provider';

function parseProviderJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    for (let start = candidate.indexOf('{'); start !== -1; start = candidate.indexOf('{', start + 1)) {
      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let index = start; index < candidate.length; index += 1) {
        const char = candidate[index];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\' && inString) {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(candidate.slice(start, index + 1));
          } catch {
            break;
          }
        }
      }
    }
    throw new Error('Provider response did not contain JSON');
  }
}

export interface KnowledgeInput {
  scenario: string;
  profile: SleepProfile;
  assessmentResult?: AssessmentResult;
}

export async function processKnowledge(input: KnowledgeInput): Promise<{ status: number; body: unknown }> {
  if (!input || typeof input.scenario !== 'string' || !input.profile) {
    return { status: 400, body: { error: 'scenario and profile are required' } };
  }

  if (!isSleepScenario(input.scenario)) {
    return { status: 400, body: { error: 'Invalid scenario' } };
  }

  const scenario = input.scenario as SleepScenario;

  const hasAssessmentRisk =
    input.assessmentResult?.isi.level === 'severe' ||
    input.assessmentResult?.riskFlags.some((flag) => detectHighRiskSignal(flag)) === true;

  if (detectHighRiskSignal(input.profile.safetySignals.join(' ')) || input.profile.safetySignals.length > 0 || hasAssessmentRisk) {
    return {
      status: 200,
      body: fallbackKnowledgeResponse(scenario, '你的档案或测评结果包含需要谨慎对待的信号，建议优先寻求专业评估。'),
    };
  }

  try {
    const prompt = buildKnowledgePrompt(input.profile, scenario, input.assessmentResult);
    const providerResult = await callAiProvider(prompt);
    const parsed = parseProviderJson(providerResult.content);
    return { status: 200, body: normalizeKnowledgeResponse(parsed) };
  } catch (error) {
    console.error('Knowledge handler error:', error instanceof Error ? error.message : String(error));
    return { status: 200, body: fallbackKnowledgeResponse(scenario) };
  }
}
