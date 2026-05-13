import { useState, useRef } from 'react';
import { api } from '../services/api';

export default function WoundCamera({ patientId }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus(null);
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return;
    setStatus('loading');
    try {
      const res = await api.submitWoundImage(patientId, 5, file);
      setResult(res);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const scoreColor = (s) => s >= 75 ? 'var(--accent-green)' : s >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="page">
      <div className="fade-in" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Wound Analysis</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>AI-powered wound healing assessment</p>
      </div>

      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <div
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${preview ? 'transparent' : 'var(--border)'}`,
            borderRadius: 12, minHeight: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', position: 'relative',
            background: 'var(--bg-surface)',
          }}
        >
          {preview
            ? <img src={preview} alt="Wound" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
            : <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                <p style={{ fontSize: '0.85rem' }}>Tap to take photo or upload</p>
              </div>
          }
        </div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment"
          style={{ display: 'none' }} onChange={handleFile} />
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }}
        onClick={analyze} disabled={!file || status === 'loading'}>
        {status === 'loading' ? '⟳ Analyzing with Gemini...' : '→ Analyze Wound'}
      </button>

      {status === 'success' && result && (
        <div className="card slide-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p className="section-label" style={{ margin: 0 }}>Wound Score</p>
            <div className="score-ring" style={{ borderColor: scoreColor(result.wound_score), color: scoreColor(result.wound_score), width: 70, height: 70 }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{result.wound_score}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>/100</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 8 }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Healing Stage</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{result.healing_stage?.replace('_', ' ')}</p>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 8 }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Infection Risk</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: result.infection_probability > 0.5 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {(result.infection_probability * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          {result.flags?.length > 0 && (
            <div>
              {result.flags.map(f => (
                <span key={f} className="badge badge-amber" style={{ marginRight: 6, marginBottom: 4 }}>⚠ {f.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 10, fontStyle: 'italic' }}>{result.clinical_notes}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="card" style={{ borderColor: 'rgba(252, 129, 129, 0.3)' }}>
          <span className="badge badge-red">⚠ Analysis Failed</span>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Could not analyze image. Check API connection.</p>
        </div>
      )}
    </div>
  );
}
