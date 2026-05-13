import { useState } from 'react';
import { api } from '../services/api';

export default function CheckIn({ patientId }) {
  const [form, setForm] = useState({
    temperature: '', spo2: '', raw_pain_score: '',
    medication_drug: '', medication_hours_since_dose: '', day_post_op: 5,
  });
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setStatus('loading');
    try {
      const payload = {
        patient_id: patientId,
        day_post_op: Number(form.day_post_op),
        temperature: form.temperature ? Number(form.temperature) : null,
        spo2: form.spo2 ? Number(form.spo2) : null,
        raw_pain_score: form.raw_pain_score ? Number(form.raw_pain_score) : null,
        medication_drug: form.medication_drug || null,
        medication_hours_since_dose: form.medication_hours_since_dose ? Number(form.medication_hours_since_dose) : null,
      };
      const res = await api.submitCheckin(payload);
      setResult(res);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  return (
    <div className="page">
      <div className="fade-in" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Daily Check-In</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Day {form.day_post_op} post-surgery</p>
      </div>

      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <p className="section-label">Vitals</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Temperature °C</p>
            <input className="input" type="number" step="0.1" placeholder="37.0" value={form.temperature} onChange={e => set('temperature', e.target.value)} />
          </label>
          <label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>SpO₂ %</p>
            <input className="input" type="number" placeholder="98" value={form.spo2} onChange={e => set('spo2', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <p className="section-label">Pain Assessment</p>
        <label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Pain Score (0–10)</p>
          <input className="input" type="range" min="0" max="10" step="0.5" value={form.raw_pain_score || 0}
            onChange={e => set('raw_pain_score', e.target.value)} style={{ padding: 0, marginBottom: 8 }} />
          <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, color: form.raw_pain_score >= 7 ? 'var(--accent-red)' : form.raw_pain_score >= 4 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
            {form.raw_pain_score || '0'}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/10</span>
          </div>
        </label>
      </div>

      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <p className="section-label">Medication</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Drug</p>
            <select className="input" value={form.medication_drug} onChange={e => set('medication_drug', e.target.value)}
              style={{ cursor: 'pointer' }}>
              <option value="">None</option>
              <option value="tramadol">Tramadol</option>
              <option value="ibuprofen">Ibuprofen</option>
              <option value="paracetamol">Paracetamol</option>
              <option value="morphine">Morphine</option>
              <option value="naproxen">Naproxen</option>
            </select>
          </label>
          <label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Hours since dose</p>
            <input className="input" type="number" step="0.5" placeholder="4.5" value={form.medication_hours_since_dose}
              onChange={e => set('medication_hours_since_dose', e.target.value)} />
          </label>
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}
        onClick={submit} disabled={status === 'loading'}>
        {status === 'loading' ? '⟳ Analyzing...' : '→ Submit Check-In'}
      </button>

      {status === 'success' && (
        <div className="card slide-up" style={{ borderColor: 'rgba(104, 211, 145, 0.3)', background: 'rgba(104, 211, 145, 0.05)' }}>
          <span className="badge badge-green">✓ Submitted</span>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Check-in accepted. AI analysis running in background.
          </p>
        </div>
      )}
      {status === 'error' && (
        <div className="card slide-up" style={{ borderColor: 'rgba(252, 129, 129, 0.3)', background: 'rgba(252, 129, 129, 0.05)' }}>
          <span className="badge badge-red">⚠ Error</span>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Could not submit. Backend running?</p>
        </div>
      )}
    </div>
  );
}
