import { useState, useRef } from 'react';

export default function VoiceCapture({ patientId, dayPostOp = 1 }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      // Pick best MIME type — ogg/opus can be decoded without ffmpeg
      const preferredTypes = [
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/webm;codecs=opus',
        'audio/webm',
      ];
      const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const ext  = type.includes('ogg') ? '.ogg' : '.webm';
        const blob = new Blob(chunksRef.current, { type });
        blob._ext  = ext;  // store for upload
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setRecording(true);
      setSeconds(0);
      setAnalysisResult(null);
      setStatus(null);
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s >= 9) { stopRecording(); return 10; }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone in browser settings.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const upload = async () => {
    if (!audioBlob) return;
    setStatus('loading');
    try {
      const form = new FormData();
      form.append('patient_id', patientId);
      form.append('day_post_op', dayPostOp);
      const ext  = audioBlob._ext || '.webm';
      const fname = `voice${ext}`;
      form.append('file', audioBlob, fname);
      const res = await fetch('/api/checkins/voice', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAnalysisResult(data);
      setStatus('success');
    } catch (err) {
      console.error('Voice upload error:', err);
      setStatus('error');
    }
  };

  const progress = Math.min(100, (seconds / 10) * 100);
  const ringColor = recording ? 'var(--accent-red)' : 'var(--accent-cyan)';
  const scoreColor = (s) => s >= 7 ? 'var(--accent-red)' : s >= 4 ? 'var(--accent-amber)' : 'var(--accent-green)';

  return (
    <div className="page">
      <div className="fade-in" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Voice Analysis</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>10-second recording for acoustic pain detection</p>
      </div>

      <div className="card fade-in" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 24px' }}>
          <svg width="160" height="160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r="72" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="80" cy="80" r="72" fill="none" stroke={ringColor} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <span style={{ fontSize: '2.5rem' }}>{recording ? '🎙️' : '🎤'}</span>
            {recording && <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-red)' }}>{seconds}s</span>}
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
          {recording ? 'Speak naturally — describe how you feel today' : 'Press start and speak for 10 seconds'}
        </p>

        <button className={`btn ${recording ? 'btn-ghost' : 'btn-primary'}`} style={{ width: '100%' }}
          onClick={recording ? stopRecording : startRecording}>
          {recording ? '⏹ Stop Recording' : '● Start 10s Recording'}
        </button>

        {audioUrl && !recording && (
          <div style={{ marginTop: 16 }}>
            <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 12 }} />
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={upload} disabled={status === 'loading'}>
              {status === 'loading' ? '⟳ Analyzing acoustics...' : '→ Submit for Analysis'}
            </button>
          </div>
        )}
      </div>

      {/* Results card */}
      {status === 'success' && analysisResult && (
        <div className="card slide-up" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="badge badge-green">✓ Analysis Complete</span>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: `3px solid ${scoreColor(analysisResult.pain_score)}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: scoreColor(analysisResult.pain_score) }}>
                {analysisResult.pain_score != null ? analysisResult.pain_score.toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>/10</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'F0 Mean (Hz)', value: analysisResult.f0_mean != null ? analysisResult.f0_mean.toFixed(1) : '—' },
              { label: 'Pitch Variance', value: analysisResult.f0_std != null ? analysisResult.f0_std.toFixed(2) : '—' },
              { label: 'RMS Energy', value: analysisResult.rms_energy != null ? analysisResult.rms_energy.toFixed(4) : '—' },
              { label: 'Confidence', value: `${((analysisResult.confidence || 0) * 100).toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 8 }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>
          {analysisResult.low_confidence && (
            <p style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
              Short recording — confidence reduced. Try a full 10s clip.
            </p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="card" style={{ borderColor: 'rgba(252,129,129,0.3)', marginBottom: 16 }}>
          <span className="badge badge-red">Analysis Failed</span>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Could not analyze audio. Ensure backend is running and clip is at least 3 seconds.
          </p>
        </div>
      )}

      <div className="privacy-notice">
        <span>🔒</span>
        <span>Voice recordings are analyzed for acoustic features only and immediately discarded.</span>
      </div>
    </div>
  );
}
