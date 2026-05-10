import type { AssessmentResult, ChatMessage, DailyTaskLog, FeedbackEvent, KnowledgeResponse, RelaxationSession, ReminderSettings, SleepDiaryEntry, SleepProfile, SleepProgram, SleepScenario } from '../domain/types';

export type ChatHistoryScope = 'general' | SleepScenario;
type ScopedChatHistories = Partial<Record<ChatHistoryScope, ChatMessage[]>>;

const keys = {
  profile: 'sleepProfile',
  chatHistory: 'chatHistory',
  feedbackEvents: 'feedbackEvents',
  assessmentResult: 'assessmentResult',
  knowledgeCache: 'knowledgeCache',
  diaryEntries: 'sleepDiaryEntries',
  reminderSettings: 'reminderSettings',
  relaxationSessions: 'relaxationSessions',
  sleepProgram: 'sleepProgram',
  dailyTaskLogs: 'dailyTaskLogs',
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

export function getDiaryEntries(): SleepDiaryEntry[] {
  return readJson<SleepDiaryEntry[]>(keys.diaryEntries, []);
}

export function saveDiaryEntries(entries: SleepDiaryEntry[]): void {
  writeJson(keys.diaryEntries, entries);
}

export function getReminderSettings(): ReminderSettings | null {
  return readJson<ReminderSettings | null>(keys.reminderSettings, null);
}

export function saveReminderSettings(settings: ReminderSettings): void {
  writeJson(keys.reminderSettings, settings);
}

export function getRelaxationSessions(): RelaxationSession[] {
  return readJson<RelaxationSession[]>(keys.relaxationSessions, []);
}

export function saveRelaxationSessions(sessions: RelaxationSession[]): void {
  writeJson(keys.relaxationSessions, sessions);
}

export function getSleepProgram(): SleepProgram | null {
  return readJson<SleepProgram | null>(keys.sleepProgram, null);
}

export function saveSleepProgram(program: SleepProgram): void {
  writeJson(keys.sleepProgram, program);
}

export function getDailyTaskLogs(): DailyTaskLog[] {
  return readJson<DailyTaskLog[]>(keys.dailyTaskLogs, []);
}

export function saveDailyTaskLogs(logs: DailyTaskLog[]): void {
  writeJson(keys.dailyTaskLogs, logs);
}

export function clearAllLocalData(): void {
  removeKey(keys.profile);
  removeKey(keys.chatHistory);
  removeKey(keys.feedbackEvents);
  removeKey(keys.assessmentResult);
  removeKey(keys.knowledgeCache);
  removeKey(keys.diaryEntries);
  removeKey(keys.reminderSettings);
  removeKey(keys.relaxationSessions);
  removeKey(keys.sleepProgram);
  removeKey(keys.dailyTaskLogs);
}
