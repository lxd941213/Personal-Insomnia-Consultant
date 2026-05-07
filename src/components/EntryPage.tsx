interface EntryPageProps {
  onStart: () => void;
}

export function EntryPage({ onStart }: EntryPageProps) {
  return (
    <main className="page entry-page">
      <section className="hero">
        <p className="eyebrow">Sleep wellness AI consultant</p>
        <h1>Get personal sleep guidance in a few minutes.</h1>
        <p className="hero-copy">
          Create a short sleep profile, then ask about falling asleep, late-night habits, stress, and sleep quality.
        </p>
        <button className="primary-button" onClick={onStart}>Create sleep profile</button>
      </section>
      <section className="notice">
        This tool provides health management reference only. It is not medical diagnosis and does not replace professional care.
      </section>
    </main>
  );
}
