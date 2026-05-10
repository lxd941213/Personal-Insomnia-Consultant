import { useEffect } from 'react';

interface EntryPageProps {
  onStart: () => void;
}

export function EntryPage({ onStart }: EntryPageProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  return (
    <main className="page entry-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <section className="hero">
        <div className="moon-icon"><i data-lucide="moon" style={{ width: '56px', height: '56px' }}></i></div>
        <p className="eyebrow">睡眠健康 AI 顾问</p>
        <h1>几分钟内<br/>获得个性化睡眠指导</h1>
        <p className="hero-copy">
          创建简单睡眠档案，然后咨询入睡困难、夜间习惯、压力与睡眠质量等问题
        </p>
        <button className="primary-button" onClick={onStart}>创建睡眠档案</button>
      </section>
      <section className="notice">
        本工具仅提供健康管理参考，不是医疗诊断，不能替代专业诊疗
      </section>
    </main>
  );
}
