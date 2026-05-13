# AEGIS — Adaptive Embodied Guardian Intelligence System

> *"Surgery doesn't end in the OR. AEGIS makes that a promise, not a threat."*

**2nd SmartEarth Hackathon 2026 · June 06–07 · Nazarbayev University, Kazakhstan**

---

## What Is AEGIS?

AEGIS is the world's first **surgical continuity intelligence system** — a multimodal agentic AI that closes the gap between the operating room and full patient recovery.

It reads surgical robot telemetry, generates a patient-specific **Surgical Risk Fingerprint**, and issues a cryptographically signed **Surgical Passport** — making every patient's surgery portable and their recovery personalized from the moment they leave the OR.

---

## 7 Core Innovations

| # | Innovation | Demo Moment |
|---|---|---|
| 1 | **Intraoperative Risk DNA** | Telemetry JSON in → Risk Fingerprint on dashboard |
| 2 | **Surgical Passport** | Judge scans QR → profile loads instantly |
| 3 | **Complication Cascade Graph** | D3 animated DAG with green intervention window |
| 4 | **Passive Keystroke Pain Detection** | Judge types → live pain index updates |
| 5 | **3D Wound Topology** (GPT-4V tier for 48h) | Photo → wound score + infection flags |
| 6 | **Pharmacokinetic Pain Correction** | Raw pain vs PCPS side-by-side |
| 7 | **Federated Complication Intelligence** | "0 bytes patient data transferred" counter |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20 LTS
- A free **Gemini API key** from [aistudio.google.com](https://aistudio.google.com) → "Get API Key"

### 1. Clone & configure
```bash
git clone <repo-url>
cd aegis
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Install frontend dependencies
```bash
cd frontend/patient-app && npm install
cd ../physician-dashboard && npm install
cd ../..
```

### 4. Generate ECDSA keys for Surgical Passport (one-time)
```bash
python scripts/gen_ecdsa_keys.py
# Paste output into .env
```

### 5. Train the cascade model (one-time, ~30s)
```bash
python -m ml.cascade_model.train
```

### 6. Launch everything
```powershell
# Windows PowerShell
.\start.ps1
```

Or manually in 3 terminals:
```bash
# Terminal 1 — Backend (http://localhost:8000)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Patient App (http://localhost:3005)
cd frontend/patient-app && npm run dev

# Terminal 3 — Physician Dashboard (http://localhost:3001)
cd frontend/physician-dashboard && npm run dev
```

**Patient 0047 demo data is auto-seeded on first backend startup.**

---

## URLs

| Service | URL |
|---|---|
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Patient App | http://localhost:3005 |
| Physician Dashboard | http://localhost:3001 |

---

## Architecture

```
aegis/
├── backend/                    # FastAPI + SQLite
│   ├── agents/                 # LangChain + Gemini agents
│   │   ├── orchestrator.py     # Master agent (parallel processing)
│   │   ├── cascade_agent.py    # Complication DAG builder
│   │   ├── escalation_agent.py # Evidence Brief + WhatsApp alert
│   │   ├── wound_agent.py      # Gemini 1.5 Flash vision
│   │   └── pain_agent.py       # Multi-signal pain fusion
│   ├── services/               # Business logic
│   │   ├── risk_fingerprint.py # Surgical Risk DNA
│   │   ├── passport.py         # ECDSA signing
│   │   ├── pk_correction.py    # Pharmacokinetic PCPS
│   │   ├── keystroke.py        # Typing biomarker extraction
│   │   ├── voice.py            # librosa acoustic features
│   │   └── federated.py        # Simulated 3-node federated learning
│   └── api/                    # REST endpoints
│
├── frontend/
│   ├── patient-app/            # React PWA (port 3005)
│   │   └── pages: CheckIn, WoundCamera, VoiceCapture, KeystrokeLive, Passport
│   └── physician-dashboard/    # React dashboard (port 3001)
│       └── pages: RiskQueue, PatientView, CascadeGraph, EvidenceBrief, PassportScanner, FederatedNetwork
│
├── ml/
│   ├── cascade_model/          # GBM complication predictor (model.pkl)
│   └── pain_model/             # Pain signal fusion
│
├── data/simulated_or_telemetry/ # Robot telemetry JSON samples
├── scripts/
│   ├── seed_demo.py            # Seeds Patient 0047
│   └── gen_ecdsa_keys.py       # Generates Passport signing keys
└── start.ps1                   # One-click launcher (Windows)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM + Vision | Google Gemini API (`gemini-1.5-flash`) — free tier |
| Agent framework | LangChain + langchain-google-genai |
| Backend | FastAPI + SQLite + SQLAlchemy |
| Voice analysis | librosa |
| ML | scikit-learn GBM (cascade model) |
| Passport signing | ECDSA via `cryptography` |
| Federated learning | Simulated (Flower-compatible architecture) |
| Alerts | Twilio WhatsApp |
| Frontend | React 18 + Vite |
| Charts | Recharts (recovery curves) + D3.js (cascade graph) |

---

## Demo Checklist (pre-demo)

- [ ] Patient 0047 risk queue showing HIGH (72%)
- [ ] Cascade Graph animating with green intervention window at Day 3
- [ ] Wound analysis returning score from pre-loaded image
- [ ] Keystroke monitor responding live in browser (KeystrokeLive page)
- [ ] Twilio WhatsApp alert sends to demo phone (test via "Escalate Patient")
- [ ] Surgical Passport QR scans and loads profile
- [ ] Federated demo shows "0 bytes patient data transferred"
- [ ] GEMINI_API_KEY active and within rate limits
- [ ] Backup screenshots saved locally in case network fails

---

## Known Limitations (be honest with judges)

| Limitation | Honest answer |
|---|---|
| 3D wound reconstruction | "48h scope — GPT-4V tier for demo. 3D is next 2 weeks." |
| Real surgical robot integration | "Simulated telemetry. Real API requires da Vinci research access." |
| Production federated learning | "Math is correct. Distributed infra is the roadmap." |
| FDA regulatory status | "Research prototype. Class II SaMD pathway is the 12-month goal." |

---

## Team

Built at the **2nd SmartEarth Hackathon 2026**, Center of Excellence in Medical Robotics and Research, Nazarbayev University, Kazakhstan.
