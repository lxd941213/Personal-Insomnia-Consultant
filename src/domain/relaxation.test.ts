import { describe, expect, it } from 'vitest';
import { buildRelaxationSession, completeRelaxationSession, relaxationTools } from './relaxation';

describe('relaxation tools', () => {
  it('defines breathing, muscle relaxation, and mindfulness tools in Chinese', () => {
    expect(relaxationTools.map((tool) => tool.id)).toEqual([
      'breathing-478',
      'muscle-relaxation',
      'mindfulness',
    ]);
    expect(relaxationTools[0].steps[0].label).toContain('吸气');
    expect(relaxationTools.every((tool) => tool.audioState === 'unavailable')).toBe(true);
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