import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import CheckIn from './pages/CheckIn';
import WoundCamera from './pages/WoundCamera';
import VoiceCapture from './pages/VoiceCapture';
import Passport from './pages/Passport';
import KeystrokeLive from './pages/KeystrokeLive';
import { useTheme } from './hooks/useTheme';

const PATIENT_ID = '0047'; // In production, from auth

function ThemeToggle({ theme, toggle }) {
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'all 0.2s',
        color: 'var(--text-secondary)',
        flexShrink: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  // Shared dayPostOp — persisted to localStorage so it survives page refresh
  const [dayPostOp, setDayPostOp] = useState(
    parseInt(localStorage.getItem('aegis_day_post_op') || '5')
  );

  const updateDay = (day) => {
    setDayPostOp(day);
    localStorage.setItem('aegis_day_post_op', String(day));
  };

  return (
    <BrowserRouter>
      <nav className="nav">
        <span className="nav-logo">⬡ AEGIS</span>
        <div className="nav-links">
          <NavLink to="/"          end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Check-In</NavLink>
          <NavLink to="/wound"         className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Wound</NavLink>
          <NavLink to="/voice"         className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Voice</NavLink>
          <NavLink to="/keystroke"     className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Pain</NavLink>
          <NavLink to="/passport"      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Passport</NavLink>
        </div>
        <ThemeToggle theme={theme} toggle={toggle} />
      </nav>

      <Routes>
        <Route path="/"          element={<CheckIn      patientId={PATIENT_ID} dayPostOp={dayPostOp} setDayPostOp={updateDay} />} />
        <Route path="/wound"     element={<WoundCamera  patientId={PATIENT_ID} dayPostOp={dayPostOp} />} />
        <Route path="/voice"     element={<VoiceCapture patientId={PATIENT_ID} dayPostOp={dayPostOp} />} />
        <Route path="/keystroke" element={<KeystrokeLive patientId={PATIENT_ID} />} />
        <Route path="/passport"  element={<Passport     patientId={PATIENT_ID} />} />
      </Routes>
    </BrowserRouter>
  );
}
