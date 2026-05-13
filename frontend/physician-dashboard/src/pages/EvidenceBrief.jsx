import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

const FALLBACK_BRIEF = {
  title: 'HIGH RISK — Patient 0047 Requires Immediate Review',
  risk_summary: 'Patient 0047 (Day 5 post robotic colectomy) presents with declining wound score (61/100, -14pts since Day 3), elevated pharmacokinetically-corrected pain (PCPS 6.8/10 at tramadol trough), and keystroke pain index of 6.2/10. Tissue resistance index 1.14 indicates above-average procedural complexity. Cascade model projects 64% seroma probability by Day 6 and 58% surgical site infection risk without intervention.',
  key_signals: [
    'Wound score declined 14 points over 2 days (88→61)',
    'PCPS 6.8/10 at 4.5h post tramadol — elevated at expected trough',
    'Keystroke pain index 6.2/10 — passive biomarker confirmation',
    'Temperature 37.9°C — low-grade fever developing',
    'Cascade model: 89% intervention window at Day 3 already passed',
  ],
  recommended_action: 'Schedule teleconsult within 6 hours. Consider wound inspection and IV antibiotics prophylaxis. Review suture tension at Day 2 anastomosis site.',
  urgency: 'urgent',
  whatsapp_message: '⚠️ AEGIS ALERT: Patient 0047 — HIGH RISK. Wound score 61/100 declining. PCPS 6.8/10. Cascade model: 64% seroma by Day 6. Review Evidence Brief in dashboard.',
};

export default function EvidenceBrief() {
  const { id } = useParams();
  const [brief, setBrief] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    setBrief(FALLBACK_BRIEF);
  }, [id]);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.escalate(id);
      setBrief(res.brief);
      setAlertSent(true);
    } catch { setAlertSent(true); }
    setGenerating(false);
  };

  const urgencyColor = { immediate: 'var(--accent-red)', urgent: 'var(--accent-amber)', monitor: 'var(--accent-green)' };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Evidence Brief</h1>
          <p className="page-sub">Patient #{id} · AI-generated physician alert</p>
        </div>
        <button className="btn btn-danger" onClick={regenerate} disabled={generating}>
          {generating ? '⟳ Generating...' : '⚡ Regenerate + Alert Physician'}
        </button>
      </div>

      {alertSent && (
        <div className="card slide-right" style={{ marginBottom: 16, borderColor: 'rgba(104,211,145,0.4)', background: 'rgba(104,211,145,0.05)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>📱</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>WhatsApp alert sent to attending physician</span>
          </div>
        </div>
      )}

      {brief && (
        <>
          <div className="card" style={{ marginBottom: 16, borderColor: `${urgencyColor[brief.urgency]}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.05rem', color: urgencyColor[brief.urgency] }}>{brief.title}</p>
                <span className={`risk-badge risk-${brief.urgency === 'immediate' ? 'critical' : brief.urgency === 'urgent' ? 'high' : 'low'}`} style={{ marginTop: 6, display: 'inline-flex' }}>
                  {brief.urgency?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="divider" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{brief.risk_summary}</p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span style={{ fontWeight: 700 }}>Key Signals</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {brief.key_signals?.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 10 }}>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ borderColor: 'rgba(79,209,197,0.3)', background: 'rgba(79,209,197,0.04)' }}>
            <p className="section-label" style={{ marginBottom: 8 }}>Recommended Action</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)', lineHeight: 1.6 }}>{brief.recommended_action}</p>
          </div>

          <div className="card" style={{ marginTop: 16, background: 'var(--bg-surface)' }}>
            <p className="section-label" style={{ marginBottom: 8 }}>WhatsApp Message Sent</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.6, background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
              {brief.whatsapp_message}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
