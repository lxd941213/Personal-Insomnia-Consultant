import { useEffect } from 'react';
import type { SleepScenario } from '../domain/types';
import { sleepScenarios } from '../domain/scenarios';

interface ScenarioLauncherProps {
  mode: 'chat' | 'knowledge';
  onSelect: (scenario: SleepScenario) => void;
  variant?: 'vertical' | 'horizontal';
}

const scenarioIcons: Record<SleepScenario, string> = {
  'hard_to_fall_asleep': 'moon',
  'late_night_habit': 'smartphone',
  'stress_anxiety': 'cloud-rain',
  'poor_sleep_quality': 'bed',
  'wellness_regulation': 'leaf',
  'bedtime_ritual': 'flame',
  'sound_meditation': 'music',
  'medical_triage': 'stethoscope',
  'diet_sleep_link': 'coffee',
};

export function ScenarioLauncher({ mode, onSelect, variant = 'horizontal' }: ScenarioLauncherProps) {
  const buttonLabel = mode === 'chat' ? '咨询' : '知识';

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  });

  if (variant === 'horizontal') {
    return (
      <div className="h-scroll">
        {sleepScenarios.map((scenario) => (
          <button
            key={scenario.id}
            className="scenario-card-compact"
            onClick={() => onSelect(scenario.id)}
            type="button"
          >
            <span className="scenario-icon" aria-hidden="true">
              <i data-lucide={scenarioIcons[scenario.id] ?? 'sparkle'} style={{ width: '22px', height: '22px' }}></i>
            </span>
            <span className="scenario-label">{scenario.label}</span>
            <span className="scenario-description">{scenario.description}</span>
            <span className="scenario-action" style={{ fontSize: '11px', marginTop: '2px' }}>
              {mode === 'knowledge' ? '查看知识' : '开始咨询'} →
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="scenario-grid">
      {sleepScenarios.map((scenario) => (
        <button
          key={scenario.id}
          className="scenario-card"
          onClick={() => onSelect(scenario.id)}
          type="button"
        >
          <span className="scenario-label">{scenario.label}</span>
          <span className="scenario-description">{scenario.description}</span>
          <span className="scenario-action">{buttonLabel}</span>
        </button>
      ))}
    </div>
  );
}
