import { describe, expect, it } from 'vitest';
import { detectHighRiskSignal } from './safety';

describe('detectHighRiskSignal', () => {
  it('flags self-harm language', () => {
    expect(detectHighRiskSignal('I cannot sleep and I want to hurt myself')).toBe(true);
  });

  it('flags suspected sleep apnea language', () => {
    expect(detectHighRiskSignal('I wake up gasping and my partner says I stop breathing')).toBe(true);
  });

  it('does not flag ordinary sleep trouble', () => {
    expect(detectHighRiskSignal('I scroll my phone until 1am and need help sleeping earlier')).toBe(false);
  });
});
