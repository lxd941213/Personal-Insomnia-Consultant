import { describe, expect, it } from 'vitest';
import { buildRelaxationSession, completeRelaxationSession, relaxationTools } from './relaxation';

describe('relaxation tools', () => {
  it('defines relaxation tools in Chinese', () => {
    expect(relaxationTools.map((tool) => tool.id)).toEqual([
      'breathing-478',
      'muscle-relaxation',
      'mindfulness',
      'body-scan',
      'sound-meditation',
    ]);
    expect(relaxationTools[0].steps[0].label).toContain('吸气');
    expect(relaxationTools.every((tool) => ['available', 'unavailable'].includes(tool.audioState))).toBe(true);
  });

  it('defines body scan as a distinct relaxation tool', () => {
    const bodyScan = relaxationTools.find((tool) => tool.id === 'body-scan');

    expect(bodyScan).toMatchObject({
      title: '身体扫描',
      description: expect.stringContaining('身体'),
    });
    expect(bodyScan?.steps.map((step) => step.label)).not.toEqual([
      '吸气 4 秒',
      '屏息 7 秒',
      '呼气 8 秒',
    ]);
  });

  it('defines sleep audio tracks for sound meditation', () => {
    const soundMeditation = relaxationTools.find((tool) => tool.id === 'sound-meditation');

    expect(soundMeditation).toMatchObject({
      title: '白噪音 / 冥想音频',
      audioState: 'available',
    });
    expect(soundMeditation?.audioTracks?.map((track) => track.title)).toEqual([
      '细雨白噪音',
      '慢海浪',
      '轻冥想底音',
    ]);
  });

  it('records started and completed sessions', () => {
    const started = buildRelaxationSession('breathing-478', new Date('2026-05-08T22:00:00.000Z'));
    const completed = completeRelaxationSession(started, 240, new Date('2026-05-08T22:04:00.000Z'));

    expect(started.status).toBe('started');
    expect(completed).toMatchObject({
      toolId: 'breathing-478',
      completedAt: '2026-05-08T22:04:00.000Z',
      durationSeconds: 240,
      status: 'completed',
      version: 2,
    });
  });
});
