import type { KnowledgeCard, KnowledgeResponse, SleepScenario } from './types';
import { defaultDisclaimer } from './safety';

function card(input: KnowledgeCard): KnowledgeCard {
  return input;
}

const safetyCard = card({
  title: '优先识别需要专业评估的信号',
  summary: '自伤想法、疑似睡眠呼吸暂停、胸痛、药物依赖、孕期或产后严重睡眠问题，应优先专业评估。',
  keyPoints: ['先排除高风险信号', '不要自行增加助眠药物', '记录症状和发生时间'],
  misconceptions: ['严重症状不应只靠生活建议处理', 'AI 内容不能替代医生判断'],
  actions: [
    { title: '整理记录', detail: '记录睡眠时长、憋醒、胸痛、用药和白天功能影响。' },
    { title: '寻求评估', detail: '根据风险信号咨询医生、睡眠门诊或相关专科。' },
  ],
  safetyNote: '如果存在急性危险或自伤风险，请立即联系当地急救或危机干预资源。',
  followUpQuestions: ['哪些情况需要去睡眠门诊？', '看医生前我应该记录什么？'],
});

const fixedWakeCard = card({
  title: '固定起床时间是优先动作',
  summary: '对很多入睡困难和熬夜习惯用户，固定起床时间比强迫早睡更容易执行。',
  keyPoints: ['每天固定起床', '周末浮动不超过 1 小时', '起床后接触自然光'],
  misconceptions: ['不是躺得越久越能补觉', '不要因为昨晚没睡好就无限推迟起床'],
  actions: [
    { title: '设定起床锚点', detail: '选择一个现实可坚持的起床时间，并连续观察一周。' },
    { title: '配合晨间光照', detail: '起床后尽量接触自然光，帮助昼夜节律稳定。' },
  ],
  safetyNote: null,
  followUpQuestions: ['我应该几点起床？', '周末可以睡懒觉吗？'],
});

const stimulusCard = card({
  title: '刺激控制减少床上的清醒焦虑',
  summary: '床应尽量重新和睡眠建立关联，减少在床上刷手机、工作和长时间清醒。',
  keyPoints: ['困了再上床', '长时间清醒时离床做低刺激活动', '避免在床上处理工作消息'],
  misconceptions: ['硬躺几个小时不一定更容易睡着', '床上刷手机会强化清醒'],
  actions: [
    { title: '低刺激离床', detail: '长时间清醒时离床，做昏暗灯光下的低刺激活动。' },
    { title: '困意回来再上床', detail: '困意明显时再回床，避免把床变成焦虑场所。' },
  ],
  safetyNote: '夜间起身注意照明和跌倒风险。',
  followUpQuestions: ['多久睡不着需要离床？', '离床后能做什么？'],
});

const relaxationCard = card({
  title: '短放松练习降低睡前唤醒',
  summary: '呼吸、肌肉放松和正念练习适合作为睡前低刺激流程的一部分。',
  keyPoints: ['练习时间短也有价值', '不追求立刻睡着', '出现不适就停止'],
  misconceptions: ['放松训练不是催眠开关', '屏息不舒服时不需要硬撑'],
  actions: [
    { title: '慢呼气', detail: '用 2-4 分钟练习慢呼气，感到头晕时停止。' },
    { title: '身体扫描', detail: '从脚到头观察紧张部位，配合自然呼吸。' },
  ],
  safetyNote: '胸闷、头晕或明显不适时停止练习。',
  followUpQuestions: ['4-7-8 呼吸不舒服怎么办？', '放松练习什么时候做？'],
});

export function buildTrustedKnowledgeResponse(scenario: SleepScenario): KnowledgeResponse {
  const scenarioCards: Partial<Record<SleepScenario, KnowledgeCard[]>> = {
    hard_to_fall_asleep: [fixedWakeCard, stimulusCard, relaxationCard],
    late_night_habit: [fixedWakeCard, relaxationCard],
    stress_anxiety: [relaxationCard, stimulusCard],
    poor_sleep_quality: [fixedWakeCard, relaxationCard],
    wellness_regulation: [relaxationCard, fixedWakeCard],
    bedtime_ritual: [relaxationCard, fixedWakeCard],
    sound_meditation: [relaxationCard],
    medical_triage: [safetyCard],
    diet_sleep_link: [fixedWakeCard],
  };

  return {
    scenario,
    cards: scenarioCards[scenario] ?? [fixedWakeCard, relaxationCard],
    disclaimer: `以上内容仅提供健康管理参考，${defaultDisclaimer}`,
    generatedAt: new Date().toISOString(),
  };
}
