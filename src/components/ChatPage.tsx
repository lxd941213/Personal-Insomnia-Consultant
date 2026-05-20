import { type FormEvent, useState, useCallback, useEffect, useRef } from 'react';
import { sendChatMessage } from '../api/chatClient';
import type { AssessmentResult, ChatMessage, FeedbackEvent, SleepProfile, SleepScenario } from '../domain/types';
import { createSleepProgram, resolveProgramState, resolveTodayProgramTask } from '../domain/program';
import { getScenarioDefinition } from '../domain/scenarios';
import { buildUserSleepContext } from '../domain/sleepContext';
import { type ChatHistoryScope, getDailyTaskLogs, getDiaryEntries, getFeedbackEvents, getScopedChatHistory, getSleepProgram, saveFeedbackEvents, saveScopedChatHistory } from '../storage/localStore';
import { FeedbackControl } from './FeedbackControl';
import { MessageList } from './MessageList';

interface ChatPageProps {
  profile: SleepProfile;
  chatScope?: ChatHistoryScope;
  assessmentResult?: AssessmentResult | null;
  initialInput?: string;
  initialScenario?: SleepScenario | null;
  onBack: () => void;
  onOpenResetDrawer: () => void;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatPage({ profile, chatScope = 'general', assessmentResult, initialInput, initialScenario, onBack, onOpenResetDrawer }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getScopedChatHistory(chatScope));
  const [feedback, setFeedback] = useState<FeedbackEvent[]>(() => getFeedbackEvents());
  const [input, setInput] = useState(initialInput ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const scenarioDefinition = initialScenario ? getScenarioDefinition(initialScenario) : undefined;
  const hasUserMessage = messages.some((message) => message.role === 'user');

  useEffect(() => {
    if (initialInput && messages.length === 0) {
      setInput(initialInput);
    }
  }, [initialInput, messages.length]);

  useEffect(() => {
    setMessages(getScopedChatHistory(chatScope));
  }, [chatScope]);

  const requestAssistantReply = useCallback(async (
    userMessage: ChatMessage,
    visibleMessages: ChatMessage[],
    historyForApi: ChatMessage[],
    restoreInputOnError: boolean,
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setPending(true);
    setError('');

    try {
      const diaryEntries = getDiaryEntries();
      const programLogs = getDailyTaskLogs();
      const storedProgram = getSleepProgram();
      const sleepContext = buildUserSleepContext({
        profile,
        assessmentResult: assessmentResult ?? null,
        diaryEntries,
        program: storedProgram,
        taskLogs: programLogs,
        message: userMessage.content,
      });
      const diarySummary = sleepContext.diarySummary && sleepContext.diarySummary.entryCount > 0
        ? sleepContext.diarySummary
        : undefined;
      const program = sleepContext.program ?? createSleepProgram({
        profile: sleepContext.profile,
        assessmentResult: sleepContext.assessmentResult,
        diarySummary,
      });
      const programState = resolveProgramState({
        program,
        profile: sleepContext.profile,
        assessmentResult: sleepContext.assessmentResult,
        diarySummary,
        logs: sleepContext.taskLogs,
        today: new Date().toISOString().slice(0, 10),
      });
      const todayTask = resolveTodayProgramTask(programState);

      const response = await sendChatMessage({
        profile,
        message: userMessage.content,
        history: historyForApi,
        assessmentResult: assessmentResult ?? undefined,
        scenario: initialScenario ?? undefined,
        diarySummary,
        programContext: {
          currentDay: programState.program.currentDay,
          todayTask: todayTask.task,
          stats: programState.stats,
          safetyStatus: programState.program.status,
          safetyTriage: sleepContext.safetyTriage,
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: response.summary,
        response,
        createdAt: new Date().toISOString(),
      };
      const saved = [...visibleMessages, assistantMessage];
      setMessages(saved);
      saveScopedChatHistory(chatScope, saved);
    } catch (requestError) {
      if (controller.signal.aborted || (requestError instanceof DOMException && requestError.name === 'AbortError')) {
        return;
      }
      if (restoreInputOnError) {
        setInput(userMessage.content);
      }
      setError('暂时无法生成建议，请稍后重试');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setPending(false);
      }
    }
  }, [profile, assessmentResult, initialScenario, chatScope]);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || pending) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: input.trim(), createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveScopedChatHistory(chatScope, nextMessages);
    setInput('');

    await requestAssistantReply(userMessage, nextMessages, messages, true);
  }, [input, pending, messages, chatScope, requestAssistantReply]);

  const stopReply = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setPending(false);
  }, []);

  const clearChatRecords = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setPending(false);
    setError('');
    setMessages([]);
    saveScopedChatHistory(chatScope, []);
  }, [chatScope]);

  const regenerateLastReply = useCallback(async () => {
    if (pending) return;

    const lastUserIndex = [...messages].map((message) => message.role).lastIndexOf('user');
    if (lastUserIndex < 0) return;

    const userMessage = messages[lastUserIndex];
    const historyForApi = messages.slice(0, lastUserIndex);
    const visibleMessages = messages.slice(0, lastUserIndex + 1);
    setMessages(visibleMessages);
    saveScopedChatHistory(chatScope, visibleMessages);

    await requestAssistantReply(userMessage, visibleMessages, historyForApi, false);
  }, [pending, messages, chatScope, requestAssistantReply]);

  const recordFeedback = useCallback((value: 'useful' | 'not_useful') => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistant) return;

    const next = [...feedback, { messageId: lastAssistant.id, value, createdAt: new Date().toISOString() }];
    setFeedback(next);
    saveFeedbackEvents(next);
  }, [messages, feedback]);

  return (
    <main className="page chat-page">
      <header className="chat-header">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>
            返回
          </button>
          <h1>{scenarioDefinition ? scenarioDefinition.label : '睡眠咨询'}</h1>
          <p>{profile.ageRange} · {scenarioDefinition?.label ?? profile.mainConcern} · 通常睡眠 {profile.bedtime}-{profile.wakeTime}</p>
        </div>
        <button type="button" className="reset-btn" onClick={onOpenResetDrawer}>重置档案</button>
      </header>

      {assessmentResult && (
        <div className="assessment-summary">
          <span className="assessment-tag">ISI: {assessmentResult.isi.score} ({assessmentResult.isi.level})</span>
          <span className="assessment-tag">PSQI: {assessmentResult.psqiLite.score} ({assessmentResult.psqiLite.level})</span>
        </div>
      )}

      <MessageList messages={messages} />
      {error && <p className="error">{error}</p>}
      {messages.some((message) => message.role === 'assistant') && <FeedbackControl onFeedback={recordFeedback} />}
      <div className="chat-controls" aria-label="咨询操作">
        <button type="button" className="chat-control-btn" onClick={stopReply} disabled={!pending}>停止回复</button>
        <button type="button" className="chat-control-btn" onClick={regenerateLastReply} disabled={pending || !hasUserMessage}>重新回复</button>
        <button type="button" className="chat-control-btn" onClick={clearChatRecords} disabled={pending || messages.length === 0}>清空记录</button>
      </div>
      <form className="chat-input" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={scenarioDefinition ? `咨询${scenarioDefinition.label}相关问题...` : '咨询您的睡眠问题...'}
        />
        <button className="primary-button" disabled={pending} type="submit">{pending ? '回复中...' : '发送'}</button>
      </form>
      <p className="fine-print">记录仅存储在本浏览器中，建议不作为医疗诊断</p>
    </main>
  );
}
