export type RiskLevel = 'normal' | 'high_risk';

export type SafetyTriageLevel = 'normal' | 'needs_care' | 'urgent';

export type SafetyTriageCategory =
  | 'self_harm'
  | 'sleep_apnea'
  | 'chest_pain_or_breathing'
  | 'medication_or_alcohol_dependence'
  | 'pregnancy_or_postpartum'
  | 'severe_insomnia_impairment'
  | 'major_medical_condition';

export interface SafetyTriageResult {
  level: SafetyTriageLevel;
  reasons: string[];
  categories: SafetyTriageCategory[];
  shouldBlockAi: boolean;
  careNotice: string | null;
}

export interface SafetyTriageInput {
  profile?: SleepProfile | null;
  message?: string;
  assessmentResult?: AssessmentResult | null;
  diaryNotes?: string[];
}

export interface UserSleepContext {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: ConsultationDiarySummary | null;
  program: SleepProgram | null;
  taskLogs: DailyTaskLog[];
  message: string;
  safetyTriage: SafetyTriageResult;
}

export interface CareAction {
  label: string;
  detail: string;
}

export interface SafetyDisplayCopy {
  title: string;
  summary: string;
  actions: CareAction[];
  disclaimer: string;
}

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
  gender?: Gender;
  sleepDurationHours?: string;
  occupationStress?: OccupationStress;
  emotionState?: string[];
  exerciseHabit?: string;
  dietHabit?: string[];
  phoneUsageHabit?: string;
  medicationStatus?: string[];
  medicalConditions?: string[];
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
  | 'wellness_regulation'
  | 'bedtime_ritual'
  | 'sound_meditation'
  | 'medical_triage'
  | 'diet_sleep_link';

// Assessment domain types
export type IsiLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type PsqiLevel = 'good' | 'fair' | 'poor';

export interface AssessmentUncertainItem {
  group: 'isi' | 'psqiLite';
  questionId: number;
  fallbackValue: number;
}

export interface AssessmentResponseQuality {
  confidence: 'standard' | 'estimated';
  uncertainCount: number;
  uncertainItems: AssessmentUncertainItem[];
  note: string;
}

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
  responseQuality?: AssessmentResponseQuality;
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

export interface ConsultationDiarySummary extends DiarySummary {
  daysWindow: number;
  dateRange: {
    from: string;
    to: string;
  };
  recentFactors: string[];
  recentNotes: string[];
}

export interface ReminderSettings extends SyncRecord {
  bedtimeEnabled: boolean;
  bedtimeTime: string;
  wakeEnabled: boolean;
  wakeTime: string;
  lastBedtimeAckDate: string | null;
  lastWakeAckDate: string | null;
}

export type RelaxationSessionStatus = 'started' | 'completed';

export interface RelaxationSession extends SyncRecord {
  toolId: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  status: RelaxationSessionStatus;
}

export interface RelaxationStep {
  label: string;
  durationSeconds: number;
}

export interface RelaxationAudioTrack {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  soundscape: 'rain' | 'ocean' | 'soft-tone';
}

export interface RelaxationTool {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  steps: RelaxationStep[];
  audioUrl: string | null;
  audioState: 'available' | 'unavailable';
  audioTracks?: RelaxationAudioTrack[];
}

export type SleepPlanCategory = 'cbti' | 'schedule' | 'relaxation' | 'nutrition' | 'wellness' | 'safety';

export interface SleepPlan {
  id: string;
  category: SleepPlanCategory;
  title: string;
  summary: string;
  steps: string[];
  tags: string[];
  safetyNote: string | null;
}

export interface PlanRecommendation {
  planId: string;
  priority: number;
  reasons: string[];
  matchedSignals: string[];
  safetyNote: string | null;
}

// Personalization domain types
export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'unspecified';
export type OccupationStress = 'low' | 'moderate' | 'high' | 'very_high' | 'unspecified';
export type PersonalizationSeverity = 'low' | 'mild' | 'moderate' | 'severe';
export type CareUrgency = 'routine' | 'soon' | 'urgent';
export type TcmPattern =
  | 'qi_deficiency'
  | 'yin_deficiency'
  | 'liver_qi_stagnation'
  | 'phlegm_dampness'
  | 'balanced'
  | 'unclear';

export interface PersonalizedSleepProfile {
  severity: PersonalizationSeverity;
  careAdvice: {
    shouldSeekCare: boolean;
    reasons: string[];
    urgency: CareUrgency;
  };
  behaviorTargets: string[];
  relaxationTargets: string[];
  nutritionTargets: string[];
  exerciseTargets: string[];
  tcmDirection: {
    pattern: TcmPattern;
    label: string;
    guidance: string[];
    disclaimer: string;
  };
  sevenDayPlan: Array<{
    day: number;
    title: string;
    task: string;
    checkInPrompt: string;
  }>;
  safetyBoundaries: string[];
}

// Program domain types
export type ProgramStatus = 'active' | 'completed' | 'paused' | 'needs_care';
export type TaskStatus = 'locked' | 'today' | 'completed' | 'skipped';
export type ProgramTemplateId = 'cbti_foundation_14_day';
export type ProgramTaskCategory = 'cbti' | 'sleep_hygiene' | 'relaxation' | 'schedule' | 'nutrition' | 'wellness';
export type EvidenceLabel = 'CBT-I' | '睡眠卫生' | '放松训练' | '饮食作息' | '养生参考';

export interface SleepProgram extends SyncRecord {
  startedAt: string;
  currentDay: number;
  status: ProgramStatus;
  templateId: ProgramTemplateId;
}

export interface ProgramTask {
  day: number;
  title: string;
  category: ProgramTaskCategory;
  evidenceLabel: EvidenceLabel;
  estimatedMinutes: number;
  rationale: string;
  action: string;
  fallbackAction: string;
  safetyNote: string | null;
}

export interface DailyTaskLog extends SyncRecord {
  programId: string;
  day: number;
  date: string;
  status: 'completed' | 'skipped';
  difficulty: 'easy' | 'ok' | 'hard' | null;
  sleepQuality: number | null;
  sleepLatencyMinutes: number | null;
  awakenings: number | null;
  daytimeEnergy: string;
  note: string;
}

export interface ProgramStats {
  completedCount: number;
  skippedCount: number;
  completionRate: number;
  currentStreak: number;
  needsFallback: boolean;
}

export interface ProgramReview {
  title: string;
  summary: string;
  nextStep: string;
}

export interface ResolvedProgramState {
  program: SleepProgram;
  tasks: Array<ProgramTask & { status: TaskStatus }>;
  stats: ProgramStats;
  safetyReasons: string[];
}

export interface ProgramPromptContext {
  currentDay: number;
  todayTask: ProgramTask;
  stats: ProgramStats;
  safetyStatus: ProgramStatus;
}
