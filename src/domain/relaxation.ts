import type { RelaxationSession, RelaxationTool } from './types';

export const relaxationTools: RelaxationTool[] = [
  {
    id: 'breathing-478',
    title: '4-7-8 呼吸',
    description: '用固定节奏降低睡前唤醒水平。',
    estimatedMinutes: 4,
    steps: [
      { label: '吸气 4 秒', durationSeconds: 4 },
      { label: '屏息 7 秒', durationSeconds: 7 },
      { label: '呼气 8 秒', durationSeconds: 8 },
    ],
    audioUrl: null,
    audioState: 'unavailable',
  },
  {
    id: 'muscle-relaxation',
    title: '渐进式肌肉放松',
    description: '依次紧张和放松身体部位，帮助识别紧绷感。',
    estimatedMinutes: 10,
    steps: [
      { label: '双手握拳后放松', durationSeconds: 30 },
      { label: '肩颈轻轻耸起后放松', durationSeconds: 30 },
      { label: '双腿绷紧后放松', durationSeconds: 30 },
    ],
    audioUrl: null,
    audioState: 'unavailable',
  },
  {
    id: 'mindfulness',
    title: '正念引导',
    description: '把注意力放回呼吸和身体感觉，减少反复思考。',
    estimatedMinutes: 8,
    steps: [
      { label: '观察自然呼吸', durationSeconds: 60 },
      { label: '觉察身体接触床面的感觉', durationSeconds: 60 },
      { label: '把跑开的注意力温和带回呼吸', durationSeconds: 60 },
    ],
    audioUrl: null,
    audioState: 'unavailable',
  },
  {
    id: 'body-scan',
    title: '身体扫描',
    description: '从脚到头依次觉察身体感受，温和释放紧绷。',
    estimatedMinutes: 6,
    steps: [
      { label: '觉察双脚和小腿的接触感', durationSeconds: 60 },
      { label: '放松大腿、髋部和腹部', durationSeconds: 60 },
      { label: '扫描胸口、肩颈和双手', durationSeconds: 60 },
      { label: '觉察面部、头皮和全身重量', durationSeconds: 60 },
    ],
    audioUrl: null,
    audioState: 'unavailable',
  },
  {
    id: 'sound-meditation',
    title: '白噪音 / 冥想音频',
    description: '选择柔和声景，用低音量陪伴睡前放松。',
    estimatedMinutes: 20,
    steps: [
      { label: '选择一种柔和音频', durationSeconds: 30 },
      { label: '把音量调到刚好听见', durationSeconds: 30 },
      { label: '闭眼聆听并放松肩颈', durationSeconds: 180 },
    ],
    audioUrl: null,
    audioState: 'available',
    audioTracks: [
      {
        id: 'rain-noise',
        title: '细雨白噪音',
        description: '轻密雨声感，适合遮盖环境杂音。',
        durationMinutes: 20,
        soundscape: 'rain',
      },
      {
        id: 'ocean-slow',
        title: '慢海浪',
        description: '低频起伏更明显，适合睡前降速。',
        durationMinutes: 20,
        soundscape: 'ocean',
      },
      {
        id: 'soft-meditation',
        title: '轻冥想底音',
        description: '稳定柔和的持续音，适合配合身体扫描。',
        durationMinutes: 15,
        soundscape: 'soft-tone',
      },
    ],
  },
];

export function buildRelaxationSession(toolId: string, now = new Date()): RelaxationSession {
  const iso = now.toISOString();
  return {
    id: `relax-${toolId}-${now.getTime()}`,
    toolId,
    startedAt: iso,
    completedAt: null,
    durationSeconds: 0,
    status: 'started',
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

export function completeRelaxationSession(
  session: RelaxationSession,
  durationSeconds: number,
  now = new Date(),
): RelaxationSession {
  return {
    ...session,
    completedAt: now.toISOString(),
    durationSeconds,
    status: 'completed',
    updatedAt: now.toISOString(),
    version: session.version + 1,
  };
}
