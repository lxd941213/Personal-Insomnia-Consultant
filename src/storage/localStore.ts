import type { ChatMessage, FeedbackEvent, SleepProfile } from '../domain/types';

const keys = {
  profile: 'sleepProfile',
  chatHistory: 'chatHistory',
  feedbackEvents: 'feedbackEvents',
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
  return readJson<ChatMessage[]>(keys.chatHistory, []);
}

export function saveChatHistory(messages: ChatMessage[]): void {
  writeJson(keys.chatHistory, messages);
}

export function getFeedbackEvents(): FeedbackEvent[] {
  return readJson<FeedbackEvent[]>(keys.feedbackEvents, []);
}

export function saveFeedbackEvents(events: FeedbackEvent[]): void {
  writeJson(keys.feedbackEvents, events);
}

export function clearAllLocalData(): void {
  removeKey(keys.profile);
  removeKey(keys.chatHistory);
  removeKey(keys.feedbackEvents);
}