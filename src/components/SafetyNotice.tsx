interface SafetyNoticeProps {
  notice?: string | null;
  disclaimer: string;
}

export function SafetyNotice({ notice, disclaimer }: SafetyNoticeProps) {
  return (
    <div className={notice ? 'safety-notice high-risk' : 'safety-notice'} role={notice ? 'alert' : undefined}>
      {notice && <strong>{notice}</strong>}
      <span>{disclaimer}</span>
    </div>
  );
}