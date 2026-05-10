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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  function toggleCard(title: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <main className="page knowledge-page page-enter">
      <header className="knowledge-header">
        <button type="button" className="back-btn" onClick={onBack}>
          返回
        </button>
        <h1>睡眠知识</h1>
      </header>

      {!selectedScenario && (
        <section className="knowledge-section">
          <h2>选择场景</h2>
          <ScenarioLauncher mode="knowledge" onSelect={handleScenarioSelect} variant="horizontal" />
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
                {response.cards.map((card) => {
                  const isExpanded = expandedCards.has(card.title);
                  return (
                    <article key={card.title} className="knowledge-card-refined">
                      <header>
                        <h3>{card.title}</h3>
                      </header>
                      <p className="knowledge-summary">{card.summary}</p>

                      {/* Key points - always visible */}
                      <div className="knowledge-section-inner">
                        <h4>关键要点</h4>
                        <ul>
                          {card.keyPoints.slice(0, 3).map((item) => (
                            <li key={item}><i data-lucide="sparkle" style={{ width: '12px', height: '12px', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}></i>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Expandable content */}
                      <button
                        type="button"
                        className="collapse-toggle"
                        onClick={() => toggleCard(card.title)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? '收起详情' : '展开详情'}
                      </button>

                      <div className={`collapse-content${isExpanded ? ' open' : ''}`}>
                        <div className="collapse-inner">
                          {/* Misconceptions */}
                          {card.misconceptions.length > 0 && (
                            <div className="knowledge-section-inner misconceptions-box">
                              <h4>⚠ 常见误区</h4>
                              <ul>
                                {card.misconceptions.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Actions */}
                          {card.actions.length > 0 && (
                            <div className="knowledge-section-inner">
                              <h4>可执行建议</h4>
                              <div className="actions-list">
                                {card.actions.map((item, idx) => (
                                  <div key={item.title} className="action-item">
                                    <span className="action-num">{idx + 1}</span>
                                    <p>
                                      <strong>{item.title}</strong>：{item.detail}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Safety note */}
                          {card.safetyNote && (
                            <p className="safety-notice high-risk" style={{ marginTop: '8px' }}>
                              {card.safetyNote}
                            </p>
                          )}

                          {/* Follow-up questions */}
                          {card.followUpQuestions.length > 0 && (
                            <div className="knowledge-section-inner">
                              <h4>可以继续问</h4>
                              <div className="follow-up-bar">
                                {card.followUpQuestions.map((item) => (
                                  <span key={item} className="follow-up-chip">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
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
