import type { AssessmentResult, ChatMessage, FeedbackEvent, KnowledgeResponse, SleepProfile, SleepScenario } from '../domain/types';

export type ChatHistoryScope = 'general' | SleepScenario;
type ScopedChatHistories = Partial<Record<ChatHistoryScope, ChatMessage[]>>;

const keys = {
  profile: 'sleepProfile',
  chatHistory: 'chatHistory',
  feedbackEvents: 'feedbackEvents',
  assessmentResult: 'assessmentResult',
  knowledgeCache: 'knowledgeCache',
} as const;

const memoryStore = new Map<string, string>();

function readJson<T>(key: string, fallback: T): T {
  try {
    const lsValue = window.localStorage.getItem(key);
    if (lsValue !== null) {
      return JSON.parse(lsValue) as T;
    }
    const memValue = memoryStore.get(key);
    return memValue ? JSON.parse(memValue) as T : fallback;
  } catch {
    const memValue = memoryStore.get(key);
    return memValue ? JSON.parse(memValue) as T : fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  memoryStore.set(key, serialized);
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    return;
  }
}

function removeKey(key: string): void {
  memoryStore.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

export function getSleepProfile(): SleepProfile | null {
  return readJson<SleepProfile | null>(keys.profile, null);
}

export function saveSleepProfile(profile: SleepProfile): void {
  writeJson(keys.profile, profile);
}

export function getChatHistory(): ChatMessage[] {
  return getScopedChatHistory('general');
}

export function saveChatHistory(messages: ChatMessage[]): void {
  saveScopedChatHistory('general', messages);
}

function getAllChatHistories(): ScopedChatHistories {
  const value = readJson<ChatMessage[] | ScopedChatHistories>(keys.chatHistory, {});
  if (Array.isArray(value)) {
    return { general: value };
  }
  return value;
}

export function getScopedChatHistory(scope: ChatHistoryScope): ChatMessage[] {
  return getAllChatHistories()[scope] || [];
}

export function saveScopedChatHistory(scope: ChatHistoryScope, messages: ChatMessage[]): void {
  const histories = getAllChatHistories();
  writeJson(keys.chatHistory, { ...histories, [scope]: messages });
}

export function getFeedbackEvents(): FeedbackEvent[] {
  return readJson<FeedbackEvent[]>(keys.feedbackEvents, []);
}

export function saveFeedbackEvents(events: FeedbackEvent[]): void {
  writeJson(keys.feedbackEvents, events);
}

export type KnowledgeCache = Partial<Record<SleepScenario, KnowledgeResponse>>;

export function getAssessmentResult(): AssessmentResult | null {
  return readJson<AssessmentResult | null>(keys.assessmentResult, null);
}

export function saveAssessmentResult(result: AssessmentResult): void {
  writeJson(keys.assessmentResult, result);
}

export function getKnowledgeCache(): KnowledgeCache {
  return readJson<KnowledgeCache>(keys.knowledgeCache, {});
}

export function saveKnowledgeCache(cache: KnowledgeCache): void {
  writeJson(keys.knowledgeCache, cache);
}

export function clearAllLocalData(): void {
  removeKey(keys.profile);
  removeKey(keys.chatHistory);
  removeKey(keys.feedbackEvents);
  removeKey(keys.assessmentResult);
  removeKey(keys.knowledgeCache);
}
