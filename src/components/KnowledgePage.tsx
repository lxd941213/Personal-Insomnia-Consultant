import { useState, useEffect, useCallback } from 'react';
import type { AssessmentResult, KnowledgeResponse, SleepProfile, SleepScenario } from '../domain/types';
import { generateKnowledgeCards } from '../api/knowledgeClient';
import { getKnowledgeCache, saveKnowledgeCache } from '../storage/localStore';
import { getScenarioDefinition } from '../domain/scenarios';
import { ScenarioLauncher } from './ScenarioLauncher';

interface KnowledgePageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  initialScenario?: SleepScenario;
  onBack: () => void;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export function KnowledgePage({
  profile,
  assessmentResult,
  initialScenario,
  onBack,
}: KnowledgePageProps) {
  const [selectedScenario, setSelectedScenario] = useState<SleepScenario | null>(
    initialScenario ?? null,
  );
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [response, setResponse] = useState<KnowledgeResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState('');

  const doGenerate = useCallback(
    async (scenario: SleepScenario, retryCount = 0) => {
      setLoadingState('loading');
      setError('');

      try {
        const result = await generateKnowledgeCards({
          profile,
          scenario,
          assessmentResult,
        });
        const cache = getKnowledgeCache() || {};
        saveKnowledgeCache({ ...cache, [scenario]: result });
        setResponse(result);
        setFromCache(false);
        setLoadingState('success');
      } catch {
        if (retryCount < 2) {
          await doGenerate(scenario, retryCount + 1);
        } else {
          setError('知识卡片生成失败，请稍后重试。');
          setLoadingState('error');
        }
      }
    },
    [profile, assessmentResult],
  );

  useEffect(() => {
    if (!initialScenario) return;

    const cached = getKnowledgeCache() || {};
    if (cached[initialScenario]) {
      setResponse(cached[initialScenario] ?? null);
      setFromCache(true);
      setLoadingState('success');
    } else {
      doGenerate(initialScenario);
    }
  }, [initialScenario, doGenerate]);

  const handleScenarioSelect = (scenario: SleepScenario) => {
    setSelectedScenario(scenario);
    const cached = getKnowledgeCache() || {};
    if (cached[scenario]) {
      setResponse(cached[scenario] ?? null);
      setFromCache(true);
      setLoadingState('success');
      return;
    }
    setResponse(null);
    setFromCache(false);
    doGenerate(scenario);
  };

  const handleRegenerate = () => {
    if (selectedScenario) {
      doGenerate(selectedScenario);
    }
  };

  return (
    <main className="page knowledge-page">
      <header className="knowledge-header">
        <button type="button" className="back-btn" onClick={onBack}>
          返回
        </button>
        <h1>睡眠知识</h1>
      </header>

      {!selectedScenario && (
        <section className="knowledge-section">
          <h2>选择场景</h2>
          <ScenarioLauncher mode="knowledge" onSelect={handleScenarioSelect} />
        </section>
      )}

      {selectedScenario && (
        <section className="knowledge-section">
          <div className="scenario-info">
            <span className="scenario-label">
              {getScenarioDefinition(selectedScenario)?.label ?? selectedScenario}
            </span>
          </div>

          {loadingState === 'loading' && (
            <div className="loading-state">
              <p>正在生成知识卡片...</p>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          {response && loadingState === 'success' && (
            <>
              {fromCache && <p className="cache-note">上次生成</p>}
              <div className="knowledge-list">
                {response.cards.map((card) => (
                  <article key={card.title} className="knowledge-card">
                    <header>
                      <h3>{card.title}</h3>
                    </header>
                    <p>{card.summary}</p>
                    <h4>关键要点</h4>
                    <ul>{card.keyPoints.map((item) => <li key={item}>{item}</li>)}</ul>
                    <h4>常见误区</h4>
                    <ul>{card.misconceptions.map((item) => <li key={item}>{item}</li>)}</ul>
                    <h4>可执行建议</h4>
                    <ul>{card.actions.map((item) => <li key={item.title}><strong>{item.title}</strong>：{item.detail}</li>)}</ul>
                    {card.safetyNote && <p className="safety-inline">{card.safetyNote}</p>}
                    <h4>可以继续问</h4>
                    <ul>{card.followUpQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
                  </article>
                ))}
              </div>

              <div className="chat-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleRegenerate}
                >
                  重新生成
                </button>
              </div>

              <p className="fine-print">{response.disclaimer}</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
