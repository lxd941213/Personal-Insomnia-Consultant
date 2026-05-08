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
export type IsiLevel = 'normal' | 'mild' | 'moderate' | 'severe';
export type PsqiLevel = 'normal' | 'mild' | 'moderate' | 'severe';

export interface AssessmentSectionResult {
  score: number;
  level: IsiLevel | PsqiLevel;
  label: string;
  summary: string;
}

export interface AssessmentResult {
  isiScore: number;
  isiLevel: IsiLevel;
  psqiScore: number;
  psqiLevel: PsqiLevel;
  riskFlag: boolean;
}

export interface KnowledgeCard {
  scenario: SleepScenario;
  title: string;
  content: string;
  tags: string[];
}

export interface KnowledgeResponse {
  cards: KnowledgeCard[];
  disclaimer: string;
}
