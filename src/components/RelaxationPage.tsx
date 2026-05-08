import { useState } from 'react';
import { buildRelaxationSession, completeRelaxationSession, relaxationTools } from '../domain/relaxation';
import { getRelaxationSessions, saveRelaxationSessions } from '../storage/localStore';
import type { RelaxationSession } from '../domain/types';

export function RelaxationPage({ toolId, onBack }: { toolId: string; onBack: () => void }) {
  const tool = relaxationTools.find((item) => item.id === toolId) ?? relaxationTools[0];
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [session, setSession] = useState<RelaxationSession | null>(null);

  function start() {
    setRunning(true);
    setSession(buildRelaxationSession(tool.id));
  }

  function complete() {
    if (!session) return;
    saveRelaxationSessions([...getRelaxationSessions(), completeRelaxationSession(session, tool.estimatedMinutes * 60)]);
    setRunning(false);
    setCompleted(true);
  }

  return (
    <main className="page relaxation-page">
      <button type="button" onClick={onBack}>返回</button>
      <h1>{tool.title}</h1>
      <p>{tool.description}</p>
      <p>音频即将支持</p>
      {tool.steps.map((step) => <p key={step.label}>{step.label}</p>)}
      <button type="button" onClick={start}>{running ? '进行中' : '开始'}</button>
      <button type="button" onClick={complete}>完成练习</button>
      {completed && <p>本次练习已完成</p>}
    </main>
  );
}