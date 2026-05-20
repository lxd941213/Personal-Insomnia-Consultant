import { buildConsultationDiarySummary } from './sleepDiary';
import { triageSafety } from './safety';
import type {
  AssessmentResult,
  DailyTaskLog,
  SleepDiaryEntry,
  SleepProfile,
  SleepProgram,
  UserSleepContext,
} from './types';

interface BuildUserSleepContextInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diaryEntries: SleepDiaryEntry[];
  program: SleepProgram | null;
  taskLogs: DailyTaskLog[];
  message?: string;
  today?: Date;
}

export function buildUserSleepContext(input: BuildUserSleepContextInput): UserSleepContext {
  const diarySummary = input.diaryEntries.length > 0
    ? buildConsultationDiarySummary(input.diaryEntries, input.today ?? new Date())
    : null;
  const message = input.message ?? '';
  const safetyTriage = triageSafety({
    profile: input.profile,
    message,
    assessmentResult: input.assessmentResult,
    diaryNotes: diarySummary?.recentNotes ?? [],
  });

  return {
    profile: input.profile,
    assessmentResult: input.assessmentResult,
    diarySummary,
    program: input.program,
    taskLogs: input.taskLogs,
    message,
    safetyTriage,
  };
}
