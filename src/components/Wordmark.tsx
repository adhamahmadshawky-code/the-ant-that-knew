export default function Wordmark({ size = 'normal' }: { size?: 'normal' | 'large' }) {
  const s = size === 'large' ? 64 : 30;
  return (
    <span className={`wordmark wordmark-${size}`}>
      <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden="true" className="wordmark-mark">
        <circle cx="22" cy="38" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="36" cy="30" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="50" cy="22" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M28 33 L30 32 M43 26 L45 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M52 16 l3 -5 M46 17 l-1 -6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="wordmark-text">
        <span className="wordmark-title">The Ant That Knew</span>
        <span className="wordmark-sub">ANA</span>
      </span>
    </span>
  );
}
