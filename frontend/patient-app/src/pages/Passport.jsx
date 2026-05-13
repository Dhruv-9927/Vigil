import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Passport({ patientId }) {
  const [riskData, setRiskData] = useState(null);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getRisk(patientId)
      .then(r => { setRiskData(r); setLoading(false); })
      .catch(() => { setError('Could not load risk data.'); setLoading(false); });
  }, [patientId]);

  const generatePassport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.generatePassport(patientId);
      setPassport(data);
    } catch (e) {
      setError('Could not generate passport. Backend running?');
    } finally {
      setGenerating(false);
    }
  };

  const riskColor = (level) => {
    if (!level) return 'var(--text-muted)';
    if (level === 'critical') return 'var(--accent-red)';
    if (level === 'high') return 'var(--accent-amber)';
    return 'var(--accent-green)';
  };

  if (loading) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ color: 'var(--accent-cyan)', fontSize: '2rem', animation: 'pulse 1s infinite' }}>⬡</div>
      <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Loading Surgical Passport...</p>
    </div>
  );

  return (
    <div className="page">
      <div className="fade-in" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Surgical Passport</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cryptographically signed with ECDSA — scannable by any physician</p>
      </div>

      {/* QR Code Card */}
      <div className="card fade-in" style={{ marginBottom: 16, textAlign: 'center' }}>
        {passport?.qr_image_base64 ? (
          <>
            <img
              src={`data:image/png;base64,${passport.qr_image_base64}`}
              alt="Surgical Passport QR"
              style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', borderRadius: 8, background: 'white', padding: 4 }}
            />
            <span className="badge badge-green" style={{ marginBottom: 12 }}>✓ ECDSA Signed</span>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: 8, padding: '0 8px' }}>
              {passport.passport_hash?.slice(0, 40)}...
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 200, height: 200, margin: '0 auto 16px',
              background: 'var(--bg-surface)', borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed var(--border)',
            }}>
              <span style={{ fontSize: '3rem', marginBottom: 8 }}>🔑</span>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No passport yet</p>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={generatePassport}
              disabled={generating}
            >
              {generating ? '⟳ Generating...' : '→ Generate Surgical Passport'}
            </button>
          </>
        )}
      </div>

      {/* Risk Profile */}
      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <p className="section-label">Your Risk Profile</p>
        <div style={{ display: 'grid', gap: 0 }}>
          {[
            { label: 'Patient ID', value: patientId },
            { label: 'Risk Level', value: riskData?.risk_level?.toUpperCase() || '—', color: riskColor(riskData?.risk_level) },
            { label: 'Overall Risk', value: riskData?.overall_risk != null ? `${(riskData.overall_risk * 100).toFixed(0)}%` : '—' },
            { label: 'Day Post-Op', value: riskData?.day_post_op ? `Day ${riskData.day_post_op}` : '—' },
            { label: 'Wound Score', value: riskData?.wound_component != null ? `${(riskData.wound_component * 100).toFixed(0)}/100` : '—' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(252,129,129,0.3)', marginBottom: 16 }}>
          <span className="badge badge-red">Error</span>
          <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      )}

      <div className="privacy-notice">
        <span>🔒</span>
        <span>Passport is ECDSA-signed. Hash verified without transmitting patient data.</span>
      </div>
    </div>
  );
}
