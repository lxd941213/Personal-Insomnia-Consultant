export type RiskLevel = 'normal' | 'high_risk';

export type MainConcern =
  | 'hard_to_fall_asleep'
  | 'early_waking'
  | 'frequent_waking'
  | 'vivid_dreams'
  | 'daytime_sleepiness'
  | 'late_night_habit'
  | 'other';

export interface SleepProfile {
  ageRange: string;
  bedtime: string;
  wakeTime: string;
  mainConcern: MainConcern;
  concernDuration: string;
  stressLevel: string;
  habits: string[];
  daytimeImpact: string;
  safetySignals: string[];
  optionalContext: string;
}

export interface Suggestion {
  title: string;
  detail: string;
}

export interface AiResponse {
  riskLevel: RiskLevel;
  summary: string;
  possibleFactors: string[];
  suggestions: Suggestion[];
  nextQuestions: string[];
  seekCareNotice: string | null;
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AiResponse;
  createdAt: string;
}

export interface FeedbackEvent {
  messageId: string;
  value: 'useful' | 'not_useful';
  createdAt: string;
}

// Sleep scenarios for AI knowledge cards
export type SleepScenario =
  | 'hard_to_fall_asleep'
  | 'late_night_habit'
  | 'stress_anxiety'
  | 'poor_sleep_quality'
  | 'wellness_regulation';

// Assessment domain types
export type IsiLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type PsqiLevel = 'good' | 'fair' | 'poor';

export interface AssessmentResult {
  completedAt: string;
  isi: {
    answers: number[];
    score: number;
    level: IsiLevel;
    summary: string;
  };
  psqiLite: {
    answers: number[];
    score: number;
    level: PsqiLevel;
    summary: string;
  };
  riskFlags: string[];
}

export interface KnowledgeCard {
  title: string;
  summary: string;
  keyPoints: string[];
  misconceptions: string[];
  actions: Suggestion[];
  safetyNote: string | null;
  followUpQuestions: string[];
}

export interface KnowledgeResponse {
  scenario: SleepScenario;
  cards: KnowledgeCard[];
  disclaimer: string;
  generatedAt: string;
}

// Shared diary types
export interface SyncRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BedtimeCheckin {
  mood: string;
  stressLevel: number;
  factors: string[];
  plannedActions: string[];
  notes: string;
}

export interface WakeCheckin {
  sleepStart: string;
  wakeTime: string;
  sleepLatencyMinutes: number;
  awakenings: number;
  sleepQuality: number;
  dreamNote: string;
  daytimeFeeling: string;
  notes: string;
}

export interface SleepDiaryEntry extends SyncRecord {
  date: string;
  bedtimeCheckin: BedtimeCheckin | null;
  wakeCheckin: WakeCheckin | null;
}

export interface DiarySummary {
  entryCount: number;
  averageSleepDurationMinutes: number | null;
  averageSleepLatencyMinutes: number | null;
  averageAwakenings: number | null;
  averageSleepQuality: number | null;
}
