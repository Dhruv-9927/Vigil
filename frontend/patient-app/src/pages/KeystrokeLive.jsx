import { useState, useCallback, useRef, useEffect } from 'react';
import { useKeystroke } from '../hooks/useKeystroke';

export default function KeystrokeLive({ patientId }) {
  const [liveScore, setLiveScore] = useState(null);
  const { getLivePainIndex, bufferSize } = useKeystroke(patientId, true);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const score = getLivePainIndex();
      if (score !== null) setLiveScore(Number(score));
    }, 500);
    return () => clearInterval(intervalRef.current);
  }, [getLivePainIndex]);

  const scoreColor = (s) => {
    if (s === null) return 'var(--text-muted)';
    if (s >= 7) return 'var(--accent-red)';
    if (s >= 4) return 'var(--accent-amber)';
    return 'var(--accent-green)';
  };

  const scoreLabel = (s) => {
    if (s === null) return '—';
    if (s >= 7) return 'High Pain';
    if (s >= 4) return 'Moderate';
    return 'Normal';
  };

  return (
    <div className="page">
      <div className="fade-in" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Keystroke Pain Monitor</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Passive pain detection via typing patterns</p>
      </div>

      <div className="card fade-in" style={{ textAlign: 'center', marginBottom: 16, padding: 32 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Live Pain Index</p>
        <div style={{
          width: 140, height: 140, borderRadius: '50%', margin: '0 auto 16px',
          border: `4px solid ${scoreColor(liveScore)}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: liveScore !== null ? `0 0 30px ${scoreColor(liveScore)}40` : 'none',
          transition: 'all 0.5s ease',
        }}>
          <span style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor(liveScore), lineHeight: 1 }}>
            {liveScore !== null ? liveScore.toFixed(1) : '—'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>/ 10</span>
        </div>
        <span className={`badge ${liveScore === null ? 'badge-blue' : liveScore >= 7 ? 'badge-red' : liveScore >= 4 ? 'badge-amber' : 'badge-green'}`}>
          {scoreLabel(liveScore)}
        </span>
        <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bufferSize} keystrokes captured</p>
      </div>

      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <p className="section-label">Demo — Type anything below</p>
        <textarea className="input"
          placeholder="Type naturally here to see your pain index update live. The AI analyzes timing patterns, not what you type..."
          style={{ minHeight: 120, resize: 'vertical' }}
        />
        <p style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Try typing slowly with pauses — watch the score change.
        </p>
      </div>

      <div className="privacy-notice">
        <span>🔒</span>
        <span>Keyboard timing only monitored. No key content is ever recorded or transmitted.</span>
      </div>
    </div>
  );
}
