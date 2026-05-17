import { buildPersonalizationProfile } from './personalization';
import type {
  AssessmentResult,
  DailyTaskLog,
  DiarySummary,
  ProgramPromptContext,
  ProgramReview,
  ProgramStats,
  ProgramStatus,
  ProgramTask,
  ResolvedProgramState,
  SleepProgram,
  SleepProfile,
  TaskStatus,
} from './types';

interface ProgramInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: DiarySummary | undefined;
}

interface CreateProgramInput extends ProgramInput {
  now?: Date;
}

interface ResolveProgramInput extends ProgramInput {
  program: SleepProgram;
  logs: DailyTaskLog[];
  today: string;
}

const template: ProgramTask[] = [
  {
    day: 1,
    title: '睡眠环境重置',
    category: 'sleep_hygiene',
    evidenceLabel: '睡眠卫生',
    estimatedMinutes: 10,
    rationale: '先减少光线、噪音和电子设备刺激，让卧室重新和睡眠建立关联。',
    action: '今晚睡前整理床边环境，调暗灯光，把手机放到离床至少一臂之外的位置。',
    fallbackAction: '如果时间很少，只完成调暗灯光和手机远离床边这两件事。',
    safetyNote: null,
  },
  {
    day: 2,
    title: '固定起床时间',
    category: 'schedule',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 5,
    rationale: '稳定起床时间通常比强迫自己早睡更容易帮助昼夜节律重新稳定。',
    action: '选择明天可以坚持的起床时间，周末浮动不超过 1 小时。',
    fallbackAction: '如果无法固定完整起床时间，先固定起床后 15 分钟内离床。',
    safetyNote: null,
  },
  {
    day: 3,
    title: '睡前手机边界',
    category: 'sleep_hygiene',
    evidenceLabel: '睡眠卫生',
    estimatedMinutes: 5,
    rationale: '睡前高刺激内容会提高觉醒水平，让入睡更困难。',
    action: '睡前 30 分钟停止刷短视频、工作消息和刺激内容。',
    fallbackAction: '如果无法完全停止，把屏幕调暗并只保留低刺激内容。',
    safetyNote: null,
  },
  {
    day: 4,
    title: '咖啡因和晚餐边界',
    category: 'nutrition',
    evidenceLabel: '饮食作息',
    estimatedMinutes: 5,
    rationale: '咖啡因、晚餐过晚和过饱都可能影响入睡和夜间舒适度。',
    action: '今天午后减少咖啡、浓茶、奶茶和能量饮料，睡前 3 小时避免过饱进食。',
    fallbackAction: '如果已经摄入咖啡因，记录时间和今晚入睡耗时。',
    safetyNote: '已有慢性疾病、孕期或正在用药时，饮食调整以医生建议为准。',
  },
  {
    day: 5,
    title: '短放松练习',
    category: 'relaxation',
    evidenceLabel: '放松训练',
    estimatedMinutes: 4,
    rationale: '短时呼吸练习可以降低睡前紧张和躯体唤醒。',
    action: '睡前做 4 轮 4-7-8 呼吸，屏息不适时改为自然慢呼吸。',
    fallbackAction: '如果屏息不舒服，只做 2 分钟慢呼气练习。',
    safetyNote: '呼吸练习出现头晕、胸闷或明显不适时立即停止。',
  },
  {
    day: 6,
    title: '晨间光照和白天活动',
    category: 'schedule',
    evidenceLabel: '睡眠卫生',
    estimatedMinutes: 15,
    rationale: '白天光照和活动能帮助身体区分清醒与睡眠时段。',
    action: '起床后尽量接触自然光，白天安排一次 10-15 分钟轻度活动。',
    fallbackAction: '如果无法外出，在窗边活动 5 分钟并避免白天长时间卧床。',
    safetyNote: '运动强度按自身疾病、疼痛和医生建议调整。',
  },
  {
    day: 7,
    title: '第 1 周复盘',
    category: 'wellness',
    evidenceLabel: '养生参考',
    estimatedMinutes: 8,
    rationale: '复盘能帮助识别最容易坚持的动作，而不是追求一次解决所有问题。',
    action: '回顾本周完成情况，选出 1 个最有效、1 个最难坚持的动作。',
    fallbackAction: '如果没有完整记录，只写下这周最影响睡眠的一个因素。',
    safetyNote: '复盘只用于健康管理参考，不判断疾病或疗效。',
  },
  {
    day: 8,
    title: '刺激控制入门',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 10,
    rationale: '刺激控制用于减少床与清醒焦虑之间的关联。',
    action: '上床后长时间清醒时，离床做低刺激活动，困意回来再上床。',
    fallbackAction: '如果离床很困难，先坐起并做 3 分钟低刺激阅读。',
    safetyNote: '行动时注意跌倒风险，夜间起身保持照明安全。',
  },
  {
    day: 9,
    title: '睡眠效率观察',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 6,
    rationale: '观察床上时间和实际睡眠时间，有助于理解睡眠效率。',
    action: '记录昨晚上床时间、估计入睡时间、起床时间和夜醒次数。',
    fallbackAction: '如果记不清，只记录大致入睡耗时和主观睡眠质量。',
    safetyNote: '本功能不做睡眠限制处方，只做观察和教育。',
  },
  {
    day: 10,
    title: '担忧书写',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 8,
    rationale: '把担忧提前写下来，可以减少上床后反复思考。',
    action: '睡前 1 小时写下 3 个担忧和明天可执行的下一步。',
    fallbackAction: '如果不想写长内容，只写一个最困扰的问题和一个最小行动。',
    safetyNote: '出现强烈自伤想法或无法控制的痛苦时，应及时寻求专业帮助。',
  },
  {
    day: 11,
    title: '夜醒应对',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 5,
    rationale: '夜醒后的焦虑和看时间行为会进一步强化清醒。',
    action: '夜醒后避免反复看时间，用低刺激方式等待困意回来。',
    fallbackAction: '如果忍不住看时间，把手机和时钟放到不易看到的位置。',
    safetyNote: '夜间伴随胸痛、憋醒、呼吸困难时优先专业评估。',
  },
  {
    day: 12,
    title: '渐进放松或正念',
    category: 'relaxation',
    evidenceLabel: '放松训练',
    estimatedMinutes: 10,
    rationale: '更完整的放松训练可以帮助识别并释放肌肉紧张。',
    action: '完成一次渐进式肌肉放松或身体扫描。',
    fallbackAction: '如果没有 10 分钟，只做肩颈和下颌放松各 1 分钟。',
    safetyNote: '身体疼痛、损伤或不适部位不要用力紧张肌肉。',
  },
  {
    day: 13,
    title: '晚间流程微调',
    category: 'wellness',
    evidenceLabel: '养生参考',
    estimatedMinutes: 12,
    rationale: '固定、温和、可重复的晚间流程比临睡前补救更稳定。',
    action: '选择温水洗漱、泡脚、轻拉伸或低刺激阅读中的 1-2 项组成睡前流程。',
    fallbackAction: '如果今天很忙，只保留温水洗漱和调暗灯光。',
    safetyNote: '泡脚温度避免过热；糖尿病、感觉异常或循环问题用户需谨慎。',
  },
  {
    day: 14,
    title: '第 2 周复盘和下一步',
    category: 'wellness',
    evidenceLabel: '养生参考',
    estimatedMinutes: 10,
    rationale: '两周结束后应保留有效动作，并判断是否需要专业评估。',
    action: '查看两周任务完成率和睡眠记录，选择下周继续坚持的 2 个动作。',
    fallbackAction: '如果改善不明显，整理记录并考虑咨询睡眠门诊或专业人士。',
    safetyNote: '持续严重失眠、明显日间功能受损或风险信号应优先专业评估。',
  },
];

export function getProgramTaskTemplate(): ProgramTask[] {
  return template.map((task) => ({ ...task }));
}

function nowIso(now = new Date()): string {
  return now.toISOString();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function safetyReasons(input: ProgramInput): string[] {
  const personalization = buildPersonalizationProfile({
    profile: input.profile,
    assessmentResult: input.assessmentResult,
    diarySummary: input.diarySummary,
  });

  const reasons = [...personalization.careAdvice.reasons];
  if (input.assessmentResult?.isi.level === 'severe') {
    reasons.push('失眠严重程度为重度');
  }
  return unique(reasons);
}

function statusFromSafety(input: ProgramInput): ProgramStatus {
  return safetyReasons(input).length > 0 ? 'needs_care' : 'active';
}

export function createSleepProgram(input: CreateProgramInput): SleepProgram {
  const iso = nowIso(input.now);
  return {
    id: `program-${iso.slice(0, 10)}`,
    startedAt: iso,
    currentDay: 1,
    status: statusFromSafety(input),
    templateId: 'cbti_foundation_14_day',
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

function latestLogsByDay(logs: DailyTaskLog[]): Map<number, DailyTaskLog> {
  const map = new Map<number, DailyTaskLog>();
  for (const entry of logs) {
    const previous = map.get(entry.day);
    if (!previous || entry.updatedAt >= previous.updatedAt) {
      map.set(entry.day, entry);
    }
  }
  return map;
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function dayIndexFromDate(program: SleepProgram, today: string): number {
  const start = new Date(`${dateOnly(program.startedAt)}T00:00:00`).getTime();
  const current = new Date(`${today}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(current)) return program.currentDay;

  const elapsedDays = Math.floor((current - start) / (24 * 60 * 60 * 1000));
  return Math.min(Math.max(elapsedDays + 1, 1), template.length);
}

export function buildProgramStats(logs: DailyTaskLog[]): ProgramStats {
  const latest = Array.from(latestLogsByDay(logs).values()).sort((a, b) => a.day - b.day);
  const completedCount = latest.filter((entry) => entry.status === 'completed').length;
  const skippedCount = latest.filter((entry) => entry.status === 'skipped').length;
  const total = completedCount + skippedCount;
  const completionRate = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  let currentStreak = 0;
  for (let index = latest.length - 1; index >= 0; index -= 1) {
    if (latest[index].status !== 'completed') break;
    currentStreak += 1;
  }

  const recentHardOrSkipped = latest
    .slice(-3)
    .filter((entry) => entry.status === 'skipped' || entry.difficulty === 'hard').length;

  return {
    completedCount,
    skippedCount,
    completionRate,
    currentStreak,
    needsFallback: recentHardOrSkipped >= 2,
  };
}

export function resolveProgramState(input: ResolveProgramInput): ResolvedProgramState {
  const reasons = safetyReasons(input);
  const stats = buildProgramStats(input.logs);
  const currentDay = dayIndexFromDate(input.program, input.today);
  const allDone = latestLogsByDay(input.logs).size >= template.length;
  const status: ProgramStatus = reasons.length > 0
    ? 'needs_care'
    : allDone
      ? 'completed'
      : input.program.status === 'paused'
        ? 'paused'
        : 'active';
  const program: SleepProgram = {
    ...input.program,
    currentDay,
    status,
  };
  const latest = latestLogsByDay(input.logs);
  const tasks = template.map((task) => {
    let statusForTask: TaskStatus = 'locked';
    const log = latest.get(task.day);
    if (log) statusForTask = log.status;
    else if (task.day === currentDay && status === 'active') statusForTask = 'today';
    return { ...task, status: statusForTask };
  });

  return { program, tasks, stats, safetyReasons: reasons };
}

export function resolveTodayProgramTask(state: ResolvedProgramState): { task: ProgramTask; status: TaskStatus } {
  const current = state.tasks.find((task) => task.day === state.program.currentDay) ?? state.tasks[state.tasks.length - 1];
  return { task: current, status: current.status };
}

export function buildProgramReview(logs: DailyTaskLog[], day: 7 | 14): ProgramReview {
  const stats = buildProgramStats(logs.filter((entry) => entry.day <= day));
  if (day === 7) {
    return {
      title: '第 1 周复盘',
      summary: `已完成 ${stats.completedCount} 个任务，完成率 ${stats.completionRate}%。睡眠变化需要结合更多记录继续观察。`,
      nextStep: '继续进入第 2 周，重点观察夜醒、担忧和刺激控制相关任务。',
    };
  }
  return {
    title: '第 2 周复盘',
    summary: `两周内已完成 ${stats.completedCount} 个任务，完成率 ${stats.completionRate}%。如果症状仍明显影响白天功能，建议考虑专业评估。`,
    nextStep: '保留最容易坚持的 2 个动作，并继续记录睡眠质量、入睡耗时和白天精神状态。',
  };
}

export function buildProgramContextForPrompt(context: ProgramPromptContext): string {
  return [
    '=== 当前 14 天改善计划 ===',
    `当前 14 天改善计划：第 ${context.currentDay} 天`,
    `计划状态：${context.safetyStatus}`,
    `今日任务：${context.todayTask.title}`,
    `依据标签：${context.todayTask.evidenceLabel}`,
    `任务动作：${context.todayTask.action}`,
    `替代动作：${context.todayTask.fallbackAction}`,
    `完成情况：已完成 ${context.stats.completedCount} 个，跳过 ${context.stats.skippedCount} 个，完成率 ${context.stats.completionRate}%`,
    '边界：禁止覆盖安全分流规则；禁止诊断；禁止药物或补充剂剂量；中医内容只能作为养生参考。',
  ].join('\n');
}
