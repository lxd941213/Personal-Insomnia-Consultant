import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { buildRelaxationSession, completeRelaxationSession, relaxationTools } from '../domain/relaxation';
import { getRelaxationSessions, saveRelaxationSessions } from '../storage/localStore';
import type { RelaxationAudioTrack, RelaxationSession } from '../domain/types';

interface SoundscapeNodes {
  context: AudioContext;
  source?: AudioBufferSourceNode;
  oscillator?: OscillatorNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  gain: GainNode;
}

interface UploadedAudio {
  id: string;
  name: string;
  url: string;
}

const sleepMusicRecommendations = [
  {
    title: '无人声轻钢琴',
    description: '节奏稳定，适合作为睡前低刺激背景音。',
    query: '无人声轻钢琴 助眠 30分钟',
  },
  {
    title: '自然环境音',
    description: '雨声、溪流和风声更适合遮盖轻微环境噪声。',
    query: '自然环境音 助眠 白噪音',
  },
  {
    title: '睡前冥想引导',
    description: '适合思绪停不下来时使用，建议选择语速慢的版本。',
    query: '睡前冥想引导 放松 助眠',
  },
  {
    title: '低频氛围音乐',
    description: '适合不喜欢纯白噪音的人，音量保持刚好听见。',
    query: '低频氛围音乐 睡前 放松',
  },
];

function buildMusicSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function RelaxationPage({ toolId, onBack }: { toolId: string; onBack: () => void }) {
  const tool = relaxationTools.find((item) => item.id === toolId) ?? relaxationTools[0];
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [session, setSession] = useState<RelaxationSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState('');
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [uploadedAudios, setUploadedAudios] = useState<UploadedAudio[]>([]);
  const elapsedRef = useRef(0);
  const soundscapeRef = useRef<SoundscapeNodes | null>(null);
  const uploadedUrlsRef = useRef<string[]>([]);
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

  useEffect(() => {
    return () => {
      stopSoundscape(false);
      uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function createNoiseBuffer(context: AudioContext) {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let index = 0; index < bufferSize; index += 1) {
      output[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function stopSoundscape(updateState = true) {
    const nodes = soundscapeRef.current;
    if (!nodes) return;
    nodes.source?.stop();
    nodes.oscillator?.stop();
    nodes.lfo?.stop();
    void nodes.context.close();
    soundscapeRef.current = null;
    if (updateState) setActiveTrackId(null);
  }

  function playSoundscape(track: RelaxationAudioTrack) {
    if (activeTrackId === track.id) {
      stopSoundscape();
      return;
    }

    stopSoundscape();
    setAudioError('');

    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      setAudioError('当前浏览器暂不支持内置音频播放');
      return;
    }

    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.gain.value = 0.055;
    gain.connect(context.destination);

    const nodes: SoundscapeNodes = { context, gain };

    if (track.soundscape === 'soft-tone') {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 174;
      gain.gain.value = 0.035;
      oscillator.connect(gain);
      oscillator.start();
      nodes.oscillator = oscillator;
    } else {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      source.buffer = createNoiseBuffer(context);
      source.loop = true;
      filter.type = track.soundscape === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = track.soundscape === 'rain' ? 1600 : 520;
      filter.Q.value = track.soundscape === 'rain' ? 0.8 : 0.45;
      source.connect(filter);
      filter.connect(gain);
      source.start();
      nodes.source = source;

      if (track.soundscape === 'ocean') {
        const lfo = context.createOscillator();
        const lfoGain = context.createGain();
        lfo.frequency.value = 0.12;
        lfoGain.gain.value = 0.04;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        nodes.lfo = lfo;
        nodes.lfoGain = lfoGain;
      }
    }

    soundscapeRef.current = nodes;
    setActiveTrackId(track.id);
  }

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

  function uploadAudioFiles(files: FileList | null) {
    if (!files?.length) return;
    const nextAudios = Array.from(files)
      .filter((file) => file.type.startsWith('audio/'))
      .map((file) => {
        const url = URL.createObjectURL(file);
        uploadedUrlsRef.current.push(url);
        return {
          id: `upload-${file.name}-${file.lastModified}-${url}`,
          name: file.name,
          url,
        };
      });
    if (!nextAudios.length) {
      setAudioError('请选择音频文件');
      return;
    }
    setAudioError('');
    setUploadedAudios((current) => [...current, ...nextAudios]);
  }

  const trimmedMusicSearchQuery = musicSearchQuery.trim();

  return (
    <main className="page relaxation-page">
      <button type="button" className="back-btn" onClick={onBack}>返回</button>
      <div className="relaxation-hero">
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
        <p className="relaxation-hint">{tool.audioState === 'available' ? '内置音频可试听' : '音频即将支持'}</p>
      </div>
      {tool.audioTracks && (
        <section className="audio-track-panel" aria-label="助眠音频">
          <div className="section-header">
            <h2>助眠音频</h2>
          </div>
          <div className="audio-track-list">
            {tool.audioTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                className={`audio-track-row${activeTrackId === track.id ? ' active' : ''}`}
                onClick={() => playSoundscape(track)}
              >
                <span>
                  <strong>{track.title}</strong>
                  <small>{track.description}</small>
                </span>
                <span className="audio-track-meta">
                  {track.durationMinutes} 分钟 · {activeTrackId === track.id ? '停止' : '播放'}
                </span>
              </button>
            ))}
          </div>
          {audioError && <p className="audio-error">{audioError}</p>}
        </section>
      )}
      {tool.id === 'sound-meditation' && (
        <>
          <section className="audio-track-panel" aria-label="本地音频">
            <div className="section-header">
              <h2>本地音频</h2>
            </div>
            <label className="audio-upload-card">
              <span>
                <strong>上传音频文件</strong>
                <small>支持 mp3、wav、m4a、ogg；文件只在本机浏览器播放。</small>
              </span>
              <input
                type="file"
                aria-label="上传音频文件"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                multiple
                onChange={(event) => uploadAudioFiles(event.target.files)}
              />
            </label>
            {uploadedAudios.length > 0 && (
              <div className="uploaded-audio-list" aria-label="我的音频">
                <h3>我的音频</h3>
                {uploadedAudios.map((audio) => (
                  <div key={audio.id} className="uploaded-audio-row">
                    <span>{audio.name}</span>
                    <audio controls src={audio.url} aria-label={`播放 ${audio.name}`} />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="audio-track-panel" aria-label="歌曲推荐">
            <div className="section-header">
              <h2>歌曲推荐</h2>
            </div>
            <div className="music-recommendation-grid">
              {sleepMusicRecommendations.map((item) => (
                <a
                  key={item.query}
                  className="music-recommendation-card"
                  href={buildMusicSearchUrl(item.query)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <span>检索推荐</span>
                </a>
              ))}
            </div>
            <div className="music-search-box">
              <label htmlFor="sleep-music-search">检索助眠音乐</label>
              <div>
                <input
                  id="sleep-music-search"
                  value={musicSearchQuery}
                  onChange={(event) => setMusicSearchQuery(event.target.value)}
                  placeholder="例如：森林雨声、轻音乐、冥想引导"
                />
                <a
                  className={`action-btn${trimmedMusicSearchQuery ? '' : ' disabled'}`}
                  href={buildMusicSearchUrl(`${trimmedMusicSearchQuery || '助眠音乐'} 助眠 音频`)}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!trimmedMusicSearchQuery}
                >
                  {trimmedMusicSearchQuery ? `搜索“${trimmedMusicSearchQuery}”` : '输入关键词'}
                </a>
              </div>
            </div>
          </section>
        </>
      )}
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
