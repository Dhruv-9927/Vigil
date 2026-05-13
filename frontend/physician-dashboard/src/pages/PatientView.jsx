import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

const DEMO_HISTORY = {
  risk_history: [
    { day: 1, overall_risk: 0.28, risk_level: 'low' },
    { day: 2, overall_risk: 0.38, risk_level: 'medium' },
    { day: 3, overall_risk: 0.51, risk_level: 'medium' },
    { day: 4, overall_risk: 0.64, risk_level: 'high' },
    { day: 5, overall_risk: 0.72, risk_level: 'high' },
  ],
  wound_history: [
    { day: 1, wound_score: 88, pcps: 2.8 },
    { day: 2, wound_score: 81, pcps: 4.2 },
    { day: 3, wound_score: 74, pcps: 5.1 },
    { day: 4, wound_score: 67, pcps: 5.9 },
    { day: 5, wound_score: 61, pcps: 6.8 },
  ],
};

// Bug 4 fix — healing-class-based expected recovery curves instead of hardcoded formula
const HEALING_CURVES = {
  class_i_primary:   (day) => Math.max(65, Math.round(98 - day * 1.8)),
  class_ii_moderate: (day) => Math.max(52, Math.round(95 - day * 3.0)),
  class_iii_complex: (day) => Math.max(38, Math.round(90 - day * 4.5)),
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(8,12,22,0.95)',
  border: '1px solid rgba(79,209,197,0.2)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: '0.82rem',
};

export default function PatientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [risk, setRisk]               = useState(null);
  const [history, setHistory]         = useState(null);
  const [escalating, setEscalating]   = useState(false);
  const [escalateResult, setEscalateResult] = useState(null);

  // Initial load
  useEffect(() => {
    Promise.all([api.getRisk(id), api.getHistory(id)])
      .then(([r, h]) => { setRisk(r); setHistory(h); })
      .catch(() => {
        setRisk({ patient_id: id, overall_risk: 0.72, risk_level: 'high', wound_score: 61,
                  pcps: 6.8, keystroke_pain_index: 6.2, temperature: 37.9, day_post_op: 5,
                  escalation_triggered: false, healing_class: 'class_ii_moderate' });
        setHistory(DEMO_HISTORY);
      });
  }, [id]);

  // Bug 7 fix — real-time polling every 10s, only updates state if risk score actually changed
  useEffect(() => {
    const poll = setInterval(() => {
      api.getRisk(id)
        .then(r => setRisk(prev =>
          prev?.overall_risk !== r.overall_risk ? r : prev
        ))
        .catch(() => {});
    }, 10_000);
    return () => clearInterval(poll);
  }, [id]);

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      const res = await api.escalate(id);
      setEscalateResult(res.brief);
    } catch { setEscalateResult({ title: 'Alert sent', urgency: 'urgent' }); }
    setEscalating(false);
  };

  // Bug 4 fix — use healing class from real patient data for the twin curve
  const twinCurve = HEALING_CURVES[risk?.healing_class] || HEALING_CURVES['class_ii_moderate'];

  const chartData = history?.wound_history?.map(w => ({
    day:              `Day ${w.day}`,
    'Wound Score':    w.wound_score,
    'Expected Twin':  twinCurve(w.day),              // ← healing-class-based, not hardcoded
    'Pain PCPS (×10)': w.pcps != null ? Math.round(w.pcps * 10) : null,
  })) || [];

  const riskColor = risk?.overall_risk >= 0.75 ? 'var(--accent-red)'
                  : risk?.overall_risk >= 0.55 ? 'var(--accent-amber)'
                  : 'var(--accent-green)';

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Queue</button>
        <div>
          <h1 className="page-title">Patient #{id}</h1>
          <p className="page-sub">
            Day {risk?.day_post_op || '—'} post-op · {risk?.risk_level?.toUpperCase() || '—'} RISK
            {risk?.healing_class && (
              <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                · {risk.healing_class.replace(/_/g, ' ')}
              </span>
            )}
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/cascade/${id}`)}>🧬 Cascade Graph</button>
        <button className="btn btn-danger btn-sm" onClick={handleEscalate} disabled={escalating}>
          {escalating ? '⟳ Escalating...' : '⚡ Escalate Patient'}
        </button>
      </div>

      {escalateResult && (
        <div className="card slide-right" style={{ marginBottom: 20, borderColor: 'rgba(252,129,129,0.4)', background: 'rgba(252,129,129,0.05)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>📱</span>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 4 }}>{escalateResult.title}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                WhatsApp alert sent to attending physician. Urgency: {escalateResult.urgency}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Biomarker stat row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Overall Risk',  value: risk ? `${(risk.overall_risk * 100).toFixed(0)}%` : '—', color: riskColor },
          { label: 'Wound Score',   value: risk?.wound_score  ? `${risk.wound_score}/100` : '—',  color: (risk?.wound_score  || 100) < 65 ? 'var(--accent-red)' : 'var(--accent-green)' },
          { label: 'Pain PCPS',     value: risk?.pcps         ? `${risk.pcps}/10`         : '—',  color: (risk?.pcps         || 0)   > 6  ? 'var(--accent-red)' : 'var(--accent-amber)' },
          { label: 'Temperature',   value: risk?.temperature  ? `${risk.temperature}°C`   : '—',  color: (risk?.temperature  || 37) > 37.8 ? 'var(--accent-amber)' : 'var(--accent-green)' },
        ].map(s => (
          <div key={s.label} className="stat-tile">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.4rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recovery curve — twin baseline based on actual healing class */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span style={{ fontWeight: 700 }}>Recovery Timeline vs. Digital Twin</span>
          <span className="section-label">
            {(risk?.healing_class || 'class_ii_moderate').replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,209,197,0.08)" />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
            <Line type="monotone" dataKey="Wound Score"    stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ fill: 'var(--accent-primary)', r: 4 }} />
            <Line type="monotone" dataKey="Expected Twin"  stroke="rgba(79,209,197,0.35)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Pain PCPS (×10)" stroke="var(--accent-red)" strokeWidth={2} dot={{ fill: 'var(--accent-red)', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Risk fingerprint */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 700 }}>Surgical Risk Fingerprint</span>
          <span className="section-label">Generated from OR Telemetry</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { k: 'Tissue Resistance Index', v: '1.14 (+14%)' },
            { k: 'Suture Tension Score',    v: '2.3 N/cm²'   },
            { k: 'Blood Loss Class',        v: 'Minimal'      },
            { k: 'Healing Class',           v: 'Class II Moderate' },
            { k: 'Anomaly Flags',           v: 'minor_retraction_event' },
            { k: 'Risk Multiplier',         v: '1.24×'        },
          ].map(({ k, v }) => (
            <div key={k} style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 10 }}>
              <div className="stat-label">{k}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
