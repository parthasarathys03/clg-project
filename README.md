# AI-Powered Student Performance Prediction Platform

> Final Year IEEE-Enhanced AI Project -- SKP Engineering College, IT Department

An institutional-grade academic decision-support platform that extends the IEEE student performance prediction baseline into a full AI-driven system with explainability, personalised advisory, persistent monitoring, batch operations, mathematically validated behaviour clustering, and a production-ready advisory caching architecture.

---

## Features

### Core ML and AI
- **RandomForestClassifier** (200 trees, balanced class weights) -- classifies students as **Good / Average / At Risk**
- **89.45% test accuracy | 89.33% 5-fold cross-validation**
- **AI-Only Advisory** -- Gemini 2.5 Flash generates 4 structured sections per student:
  - Personalised AI Explanation
  - Risk Factor Analysis
  - Priority Action Plan
  - 7-Day Personalised Study Schedule
- **No rule-based fallback** -- 100% AI-generated content

### Multi-Key Gemini Architecture
- **4 Gemini API keys** with automatic round-robin rotation
- Full model cascade per key: gemini-2.5-flash > gemini-2.5-flash-lite > gemini-2.0-flash > gemma-3-27b-it
- Key exhaustion detection (quota/rate limit) automatically promotes next key
- Zero demo failures due to rate limiting

### Advisory Caching System
- Every AI advisory cached by student_id + metrics SHA-256 hash
- **In-memory cache** (sub-millisecond, session lifetime) + **SQLite persistent cache** (survives restart)
- Repeat predictions return from cache -- no Gemini API call, ~400ms response
- Demo reset: re-inserts 25 students from cache in **~3 seconds** (was 13+ minutes)

### Batch Processing
- **Async CSV upload** -- POST returns immediately with batch_id
- Background thread processes students with Semaphore(3) concurrency limit
- **Real-time progress polling** every 2 seconds
- Animated progress bar: Generating AI advisories (X/Y completed)

### Analytics and Monitoring
- Teacher dashboard with section-wise risk breakdown and year distribution
- Live prediction history with search, filter, and pagination
- **Consecutive At-Risk alert detection** with bell notifications
- Student progress timeline with trend charts
- Class rankings leaderboard with composite score
- One-click CSV export for institutional records

### Behaviour Clustering (IEEE-Justified)
- **t-SNE** dimensionality reduction + **KMeans** clustering
- **Elbow Method** (inertia vs k) + **Silhouette Score** sweep (k=2..8)
- Auto-selects mathematically optimal k -- no arbitrary cluster count
- Per-cluster plain-English teacher insights

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| Backend | Python 3.11, FastAPI, Pydantic v2, Uvicorn |
| ML Engine | Scikit-learn -- RandomForestClassifier, KMeans, t-SNE, StandardScaler |
| AI Layer | Google Gemini 2.5 Flash -- 4-key rotation, AI-only |
| AI Cache | SQLite advisory_cache -- SHA-256 key, instant repeat responses |
| Database | SQLite3 -- predictions, batch jobs, training history, advisory cache |
| Dataset | 10,000-row synthetic CSV with realistic noise (3%) |

---

## Project Structure

    clg-project/
    |-- backend/
    |   |-- main.py                  # FastAPI app, endpoints, async batch worker
    |   |-- database.py              # SQLite CRUD -- predictions, cache, jobs
    |   |-- demo_seed.py             # 25 demo students, cache-backed instant reset
    |   |-- ml_model/                # RandomForest training and prediction
    |   |-- ai_advisory/
    |   |   +-- advisor.py           # Multi-key Gemini rotation + advisory cache
    |   |-- ml_analysis.py           # t-SNE + KMeans clustering analysis
    |   |-- models/schemas.py        # Pydantic request/response models
    |   |-- dataset/                 # 10,000-row training CSV
    |   +-- .env                     # API keys (GEMINI_API_KEY_1..4)
    +-- frontend/
        +-- src/
            |-- pages/
            |   |-- PredictPage.jsx      # Single student prediction + AI advisory
            |   |-- BatchUploadPage.jsx  # Async batch upload with live progress
            |   |-- DashboardPage.jsx    # Analytics dashboard
            |   |-- HistoryPage.jsx      # Prediction history
            |   |-- AlertsPage.jsx       # At-Risk alert feed
            |   |-- RankingsPage.jsx     # Class leaderboard
            |   |-- ClusteringPage.jsx   # Behaviour clustering
            |   +-- AboutPage.jsx        # Platform documentation
            |-- components/              # RiskBadge, Toast, Sidebar, etc.
            +-- api.js                   # Axios API client

---

## Setup and Running

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API keys (free tier at https://aistudio.google.com)

### Backend

    cd backend
    pip install -r requirements.txt
    # Edit .env: set GEMINI_API_KEY_1 through GEMINI_API_KEY_4
    uvicorn main:app --reload --port 8000

### Frontend

    cd frontend
    npm install
    npm run dev

API server: http://localhost:8000
Frontend:   http://localhost:3000

---

## Environment Variables (backend/.env)

    GEMINI_API_KEY_1=your-key-1
    GEMINI_API_KEY_2=your-key-2
    GEMINI_API_KEY_3=your-key-3
    GEMINI_API_KEY_4=your-key-4

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/train | Train/retrain the ML model |
| POST | /api/predict | Single student prediction |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/predictions | Paginated prediction history |
| POST | /api/batch-upload | Async batch CSV upload |
| GET | /api/batch/{id}/progress | Real-time batch progress |
| GET | /api/alerts | Consecutive At-Risk alerts |
| GET | /api/rankings | Class leaderboard |
| GET | /api/student-clusters | t-SNE + KMeans clustering |
| GET | /api/export | CSV export of all predictions |
| POST | /api/demo/reset | Instant demo reset from cache |
| GET | /api/health | System health + Gemini key count |

---

## Architecture Highlights

### AI Advisory Pipeline

    Student Input -> ML Prediction (RandomForest) -> Cache Check (SHA-256 hash)
      Cache HIT  -> Return Advisory instantly (~400ms)
      Cache MISS -> Gemini API (4-key rotation) -> Store Cache -> Return Advisory (4 sections)

### Gemini Key Rotation

    Key 1 (full model cascade) -> Key 2 -> Key 3 -> Key 4 -> RuntimeError

### Demo Reset Flow

    POST /api/demo/reset
      -> Clear predictions and batch jobs, invalidate cluster cache
      -> advisory_cache count >= 25?
          YES -> _seed_from_cache()  (~3 s, zero AI calls)
          NO  -> seed_demo_data()    (full AI, 4s delay between calls)

---

## IEEE Paper Reference

**Title:** Early Predicting of Students Performance in Higher Education
**Source:** IEEE (2023)
**URL:** https://ieeexplore.ieee.org/abstract/document/10056943

This project takes the IEEE prediction core (RandomForest/SVM) as its baseline and elevates it to an institutional AI platform -- adding explainability, personalised advisory, persistent monitoring, batch operations, mathematically validated behaviour clustering, advisory caching, and a multi-key AI architecture.

---

## Model Performance

| Metric | Score |
|--------|-------|
| Test Accuracy | 89.45% |
| 5-Fold CV Score | 89.33% |
| Features | attendance, internal marks, assignment score, study hours |
| Classes | Good, Average, At Risk |

---

## Demo Students

25 Tamil-named IT students (SKP Engineering College, IT-A section, Year 4):
- **8 High Performing** -- attendance 87-95%, marks 80-91
- **10 Average** -- attendance 73-80%, marks 57-66
- **7 At Risk** -- attendance 42-58%, marks 28-42

Demo reset is instant (~3 s) after first seed -- all 25 AI advisories cached in SQLite.
