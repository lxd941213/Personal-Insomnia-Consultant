import type { SleepScenario } from '../domain/types';
import { sleepScenarios } from '../domain/scenarios';

interface ScenarioLauncherProps {
  mode: 'chat' | 'knowledge';
  onSelect: (scenario: SleepScenario) => void;
}

export function ScenarioLauncher({ mode, onSelect }: ScenarioLauncherProps) {
  const buttonLabel = mode === 'chat' ? '开始咨询' : '查看知识';

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
