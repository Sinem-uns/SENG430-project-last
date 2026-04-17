# HEALTH-AI · ML Learning Tool

**Erasmus+ KA220-HED | For Healthcare Professionals**

An educational machine learning visualization tool that guides healthcare professionals and students through a complete AI model development journey — from clinical context to ethics review — with no coding required.

---

## Overview

HEALTH-AI is a browser-based ML education platform with 7 guided steps:

| Step | Name | Description |
|------|------|-------------|
| 1 | Clinical Context | Understand the clinical problem and what the AI will predict |
| 2 | Data Exploration | Load patient data, explore distributions, map features |
| 3 | Data Preparation | Handle missing values, normalise, balance classes |
| 4 | Model & Parameters | Choose and tune 6 ML algorithms with live visualisations |
| 5 | Results | Evaluate model performance with clinical interpretation |
| 6 | Explainability | Understand why the model made each prediction |
| 7 | Ethics & Bias | Review fairness, EU AI Act compliance, download certificate |

### Supported Specialties (20)
Cardiology, Radiology, Nephrology, Oncology (Breast), Neurology (Parkinson's), Diabetes, Hepatology, Stroke, Mental Health, COPD, Haematology, Dermatology, Ophthalmology, Orthopaedics, ICU/Sepsis, Obstetrics (Fetal Health), Arrhythmia, Cervical Cancer, Thyroid, Pharmacy Readmission

---

## Architecture

```
┌─────────────────────────────────┐    HTTP/REST    ┌─────────────────────────────────┐
│  Frontend (Next.js 14)          │ ──────────────▶ │  Backend (FastAPI + scikit-learn)│
│  - React 18 + TypeScript        │                 │  - Python 3.11                   │
│  - Tailwind CSS                 │ ◀────────────── │  - scikit-learn, pandas, numpy   │
│  - Zustand state                │    JSON/Base64  │  - ReportLab (PDF)               │
│  - Recharts visualisations      │                 │  - imbalanced-learn (SMOTE)      │
│  - Radix UI / shadcn            │                 │  - Ephemeral in-memory only      │
└─────────────────────────────────┘                 └─────────────────────────────────┘
         │                                                       │
         ▼                                                       ▼
    Vercel (frontend)                               Railway / Render / Fly.io (backend)
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- npm 10+

### 1. Clone / set up
```bash
git clone <repo-url>
cd health-ai
```

### 2. Generate sample data
```bash
cd backend
pip install -r requirements.txt
python data/generate_data.py
```

### 3. Start backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Backend health check: http://localhost:8000/health

### 4. Start frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# .env.local already points to http://localhost:8000 by default
npm run dev
```
Open http://localhost:3000

---

## Running Tests

### Backend tests
```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

### Frontend unit + component tests
```bash
cd frontend
npm test
```

### Frontend E2E tests (Playwright)
```bash
cd frontend
# Ensure both frontend and backend are running first
npx playwright install chromium
npx playwright test
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed frontend origins (comma-separated) |
| `MAX_UPLOAD_MB` | `50` | Maximum CSV upload size |

---

## Production Deployment

### Frontend → Vercel

1. Push repository to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Set root directory: `frontend`
4. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
5. Deploy

The `next.config.ts` API proxy is used in development. In production, set `NEXT_PUBLIC_API_URL` directly to your backend URL — the frontend `api.ts` client uses it directly.

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the repository, set root directory: `backend`
3. Railway auto-detects the `Procfile`: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `CORS_ORIGINS=https://your-app.vercel.app`
5. Add volume or use ephemeral storage (no DB needed — all stateless)

#### Alternative: Render
1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt && python data/generate_data.py`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Alternative: Fly.io
```bash
cd backend
fly launch  # follows prompts, auto-detects Python
fly deploy
```

### Docker Compose (local full stack)
```yaml
# docker-compose.yml (at repo root)
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - CORS_ORIGINS=http://localhost:3000
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on: [backend]
```

---

## Privacy & Data Handling

- **No database**: uploaded CSV files are processed entirely in memory (Python) and never written to disk
- **Ephemeral**: all data exists only for the duration of a single API request
- **No login required**: educational tool, no user accounts
- **GDPR messaging**: displayed on all data upload screens
- **Recommendation**: use anonymised or synthetic data for learning; never upload identifiable patient records to a shared server

---

## Assumptions & Design Decisions

1. **Stateless API**: frontend sends preprocessed data arrays with every training request rather than server-side sessions; simpler, scales better
2. **Client-side visualisations**: model-specific educational diagrams (KNN scatter, SVM boundary, etc.) run in the browser for instant slider feedback; actual ML evaluation runs server-side
3. **Built-in synthetic datasets**: all sample data is generated from published schemas with clinically realistic distributions; no real patient data is bundled
4. **PDF certificates**: generated server-side with ReportLab for consistent cross-browser rendering; returned as base64 string
5. **SMOTE**: applied only to training split, never test split, to avoid data leakage
6. **Multiclass ROC**: uses macro-average OvR for AUC; confusion matrix shows full NxN matrix
7. **Auto-retrain**: debounced 600ms after slider changes; can be disabled for large datasets

---

## Definition of Done

- [x] 7 steps implemented
- [x] Step lock/unlock logic (columnMapping → Step 3, processedData → Step 4, trainedModels → Step 5, activeResults → Step 6, Step 7 always accessible)
- [x] CSV upload + validation (type, size ≤50MB, ≥10 rows, ≥1 numeric)
- [x] Column mapper works and gates Step 3
- [x] Preprocessing works (missing values, normalization, SMOTE, train/test split)
- [x] 6 models implemented (KNN, SVM, Decision Tree, Random Forest, Logistic Regression, Naive Bayes)
- [x] Unique visualization per model (KNN scatter/radius, SVM boundary, DT flowchart, RF vote, LR sigmoid, NB bars)
- [x] Auto-retrain with debounce implemented
- [x] Model comparison table works (no duplicate rows)
- [x] 6 metrics displayed with clinical interpretation (Accuracy, Sensitivity, Specificity, Precision, F1, AUC)
- [x] Confusion matrix implemented
- [x] ROC curve implemented
- [x] Low sensitivity warning (< 50% → red danger banner)
- [x] Explainability screen (feature importance + patient-level waterfall)
- [x] Patient-level explanation with contributions
- [x] Subgroup bias audit table
- [x] Bias auto-detection banner (>10pp delta → red banner)
- [x] EU AI Act checklist (8 items, 2 pre-checked)
- [x] Training data representation chart
- [x] AI failure case cards (3: red/amber/green)
- [x] PDF certificate generation (domain + model + metrics + bias + checklist + datetime)
- [x] Help/glossary implemented (21 terms)
- [x] Reset flow with confirmation
- [x] Specialty change reset confirmation
- [x] Responsive UI (desktop/tablet/mobile fallback)
- [x] Accessibility basics (semantic HTML, aria-labels, keyboard navigation, focus states, color contrast)
- [x] Backend tests (preprocessing, metrics, models, API integration)
- [x] Frontend tests (unit, component, e2e)
- [x] Deployment instructions included (Vercel + Railway/Render/Fly.io + Docker)
- [x] 20 specialties configured
- [x] 7 built-in sample datasets
- [x] Plain clinical language throughout
- [x] No login required
- [x] Privacy/GDPR messaging visible
- [x] Clinical warning on ML limitations

---

## Project Structure

```
health-ai/
├── README.md
├── docker-compose.yml
├── frontend/                    # Next.js 14 + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── providers.tsx
│   │   │   └── globals.css
│   │   ├── lib/
│   │   │   ├── types.ts        # All TypeScript types
│   │   │   ├── domains.ts      # 20 specialty configs
│   │   │   ├── store.ts        # Zustand global state
│   │   │   ├── api.ts          # Backend API client
│   │   │   ├── utils.ts        # Helpers
│   │   │   └── validation.ts   # Zod schemas
│   │   ├── components/
│   │   │   ├── ui/             # shadcn primitives (15 components)
│   │   │   ├── layout/         # AppShell, Navbar, Stepper, DomainSelector
│   │   │   ├── shared/         # Banner, MetricCard, InfoCard, HelpModal
│   │   │   └── steps/          # Step1-7 screens
│   │   └── tests/
│   │       ├── unit/           # utils, validation, domains
│   │       ├── components/     # Banner, MetricCard, Stepper
│   │       └── e2e/            # Playwright journey tests
│   └── public/
└── backend/                     # FastAPI + scikit-learn
    ├── main.py
    ├── requirements.txt
    ├── Procfile
    ├── runtime.txt
    ├── app/
    │   ├── routes/             # dataset, train, explain, bias, certificate
    │   ├── services/           # preprocessing, models, metrics, pdf_generator
    │   └── schemas/            # Pydantic v2 API models
    ├── data/
    │   ├── generate_data.py    # Generates all sample CSVs
    │   ├── cardiology.csv
    │   ├── diabetes.csv
    │   ├── breast_cancer.csv
    │   ├── parkinsons.csv
    │   ├── nephrology.csv
    │   ├── sepsis.csv
    │   └── fetal_health.csv
    └── tests/
        ├── test_preprocessing.py
        ├── test_metrics.py
        ├── test_models.py
        └── test_api.py
```

---

## Contributing

This is an Erasmus+ KA220-HED educational project. For issues and improvements, please open a GitHub issue.

## Licence

MIT — For educational use. Not for clinical decision-making.
