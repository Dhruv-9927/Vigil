import { useState } from 'react';
import { api } from '../services/api';

export default function PassportScanner() {
  const [hash, setHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scan = async () => {
    const h = hash.trim() || 'a7f3c9e2d1b4f8a0c3e5d7f9b1a2c4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4c6d8';
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await api.scanPassport(h);
      setResult(res);
    } catch {
      // Demo fallback
      setResult({
        valid: true,
        patient_id: '0047',
        patient_name: 'Demo Patient [Anonymized]',
        payload: {
          procedure_type: 'Robotic laparoscopic colectomy',
          procedure_date: '2026-06-01',
          robot_model: 'da_vinci_xi',
          tissue_resistance_index: 1.14,
          suture_tension_score: 2.3,
          blood_loss_class: 'minimal',
          healing_class: 'class_ii_moderate',
          anomaly_flags: ['minor_retraction_event'],
          signed_by: 'AEGIS-OR-NODE-NU04',
        },
        issued_at: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.generatePassport('0047');
      setResult({
        valid: true, patient_id: '0047',
        patient_name: 'Demo Patient [Anonymized]',
        payload: res.payload, issued_at: new Date().toISOString(),
        qr_image_base64: res.qr_image_base64,
      });
    } catch { setError('Could not generate. Ensure telemetry has been submitted.'); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Surgical Passport Scanner</h1>
      <p className="page-sub">Scan a patient's Surgical Passport QR to load their personalized profile</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Enter Passport Hash or Scan QR</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Passport fingerprint hash (or leave blank for Patient 0047 demo)" value={hash} onChange={e => setHash(e.target.value)} />
          <button className="btn btn-primary" onClick={scan} disabled={loading}>{loading ? '⟳' : '🔍 Scan'}</button>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={generate}>Generate Patient 0047 Passport</button>
      </div>

      {result && (
        <div className={`card slide-right ${result.valid ? '' : 'border-red'}`} style={{ borderColor: result.valid ? 'rgba(104,211,145,0.4)' : 'rgba(252,129,129,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: '2rem' }}>{result.valid ? '✅' : '❌'}</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: result.valid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {result.valid ? 'Passport Verified' : 'Invalid Passport'}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Signed by {result.payload?.signed_by || 'AEGIS-OR-NODE'} · {new Date(result.issued_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {result.qr_image_base64 && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src={`data:image/png;base64,${result.qr_image_base64}`} alt="Passport QR" style={{ width: 200, height: 200, borderRadius: 12 }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { k: 'Patient ID', v: result.patient_id },
              { k: 'Procedure', v: result.payload?.procedure_type?.replace(/_/g, ' ') },
              { k: 'Date', v: result.payload?.procedure_date },
              { k: 'Robot', v: result.payload?.robot_model?.replace(/_/g, ' ') },
              { k: 'TRI', v: `${result.payload?.tissue_resistance_index} (+${((result.payload?.tissue_resistance_index - 1) * 100).toFixed(0)}%)` },
              { k: 'Healing Class', v: result.payload?.healing_class?.replace(/_/g, ' ') },
              { k: 'Blood Loss', v: result.payload?.blood_loss_class },
              { k: 'Anomaly Flags', v: result.payload?.anomaly_flags?.join(', ') || 'None' },
            ].map(({ k, v }) => (
              <div key={k} style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 10 }}>
                <div className="stat-label">{k}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, marginTop: 4, textTransform: 'capitalize' }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
