import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { buildRelaxationSession, completeRelaxationSession, relaxationTools } from '../domain/relaxation';
import { getRelaxationSessions, saveRelaxationSessions } from '../storage/localStore';
import type { RelaxationSession } from '../domain/types';

export function RelaxationPage({ toolId, onBack }: { toolId: string; onBack: () => void }) {
  const tool = relaxationTools.find((item) => item.id === toolId) ?? relaxationTools[0];
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [session, setSession] = useState<RelaxationSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef(0);
  const totalSeconds = tool.steps.reduce((sum, step) => sum + step.durationSeconds, 0);
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const progressPercent = totalSeconds > 0 ? Math.min((elapsedSeconds / totalSeconds) * 100, 100) : 0;
  const currentStep =
    tool.steps.find((_, index) => {
      const end = tool.steps.slice(0, index + 1).reduce((sum, step) => sum + step.durationSeconds, 0);
      return elapsedSeconds < end;
    }) ?? tool.steps[tool.steps.length - 1];

  useEffect(() => {
    if (!running || completed) return;

    const timer = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
      if (elapsedRef.current >= totalSeconds) {
        setRunning(false);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, completed, totalSeconds]);

  function start() {
    if (session && !completed) {
      setRunning(true);
      return;
    }
    const nextSession = buildRelaxationSession(tool.id);
    saveRelaxationSessions([...getRelaxationSessions(), nextSession]);
    setRunning(true);
    setCompleted(false);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    setSession(nextSession);
  }

  function pause() {
    setRunning(false);
  }

  function complete() {
    if (!session) return;
    const completedSession = completeRelaxationSession(session, elapsedRef.current);
    saveRelaxationSessions([
      ...getRelaxationSessions().filter((item) => item.id !== session.id),
      completedSession,
    ]);
    setRunning(false);
    setCompleted(true);
    setSession(completedSession);
  }

  return (
    <main className="page relaxation-page">
      <button type="button" className="back-btn" onClick={onBack}>返回</button>
      <div className="relaxation-hero">
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
        <p className="relaxation-hint">音频即将支持</p>
      </div>
      <div
        className="relaxation-progress"
        style={{ '--relaxation-progress': `${progressPercent}%` } as CSSProperties}
      >
        <p>当前步骤：{currentStep.label}</p>
        <p className="timer-display">剩余 {remainingSeconds} 秒</p>
      </div>
      <div className="step-list">
        {tool.steps.map((step) => (
          <p key={step.label} className={`step-item${step.label === currentStep.label ? ' active' : ''}`}>
            {step.label}
          </p>
        ))}
      </div>
      <div className="relaxation-controls">
        <button type="button" className="primary-button" onClick={start} disabled={running}>
          {session && !running && !completed ? '继续' : running ? '进行中' : '开始'}
        </button>
        {running && (
          <button type="button" className="action-btn" onClick={pause}>暂停</button>
        )}
        <button type="button" className="action-btn" onClick={complete}>完成练习</button>
      </div>
      {completed && <p className="saved-toast">本次练习已完成</p>}
    </main>
  );
}
