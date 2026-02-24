# AI-Based Student Performance Prediction and Advisory System

**Final Year AI Project** | IEEE-Enhanced Proposed System

---

## Overview

This system predicts student academic performance risk using a **RandomForestClassifier** and enriches the output with **AI-generated explanations and personalised study advisory**, forming a complete academic decision-support platform for teachers and students.

### IEEE Paper Reference
> *"Early Predicting of Students Performance in Higher Education"* — IEEE (2023)
> The paper predicts student performance using ML models based on educational data. This project implements an **improved applied system** that adds an AI explanation + advisory layer on top of the ML prediction baseline.

---

## System Architecture

```
Student Input
     │
     ▼
FastAPI Backend
     │
     ├─► RandomForestClassifier ──► risk_level + confidence + probabilities
     │         (sklearn, 200 trees)
     │
     ├─► AI Advisory Module ──► explanation + 4 recommendations
     │    (OpenAI GPT-3.5 / rule-based fallback)
     │
     └─► React Dashboard ──► Teacher analytics + Student history
```

### Workflow: Predict → Explain → Advise
1. **Input** — Teacher enters student metrics (attendance, marks, assignments, study hours)
2. **Predict** — ML model classifies: `Good` | `Average` | `At Risk`
3. **Explain** — AI generates grounded explanation of WHY the prediction occurred
4. **Advise** — AI produces 4 personalised, actionable recommendations
5. **Dashboard** — Results reflected instantly in teacher analytics panel

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts          |
| Backend    | Python 3.10+, FastAPI, Pydantic v2, Uvicorn     |
| ML Engine  | Scikit-learn RandomForestClassifier             |
| AI Layer   | OpenAI GPT-3.5-turbo (rule-based fallback)      |
| Data       | Synthetic CSV — 1500 rows, auto-generated       |

---

## Project Structure

```
student-ai-project/
├── backend/
│   ├── main.py                    # FastAPI application + all API routes
│   ├── requirements.txt
│   ├── .env                       # OPENAI_API_KEY goes here
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response models
│   ├── data/
│   │   ├── generate_dataset.py    # Synthetic 1500-row dataset generator
│   │   └── student_data.csv       # Auto-generated on first train
│   ├── ml_model/
│   │   ├── train.py               # RandomForestClassifier training pipeline
│   │   ├── predict.py             # Prediction + key factor extraction
│   │   └── model.pkl              # Serialised model (auto-generated)
│   └── ai_advisory/
│       └── advisor.py             # OpenAI + rule-based fallback
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── api.js                  # Axios API client
│       ├── index.css               # Tailwind + custom utilities
│       ├── components/
│       │   ├── Layout.jsx          # Sidebar + topbar shell
│       │   ├── StatCard.jsx        # Reusable metric card
│       │   ├── RiskBadge.jsx       # Colour-coded risk badge
│       │   └── LoadingSpinner.jsx
│       └── pages/
│           ├── Dashboard.jsx       # Home: stats + charts + recent table
│           ├── PredictPage.jsx     # Prediction form + results
│           ├── TeacherDashboard.jsx# Full analytics + pagination
│           ├── StudentHistory.jsx  # Expandable prediction history
│           └── AboutPage.jsx       # IEEE reference + system docs
│
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and add your OpenAI API key (optional — fallback works without it)
# OPENAI_API_KEY=sk-...

# Start the server
python main.py
# Backend runs at http://localhost:8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs at http://localhost:3000
```

### 3. First Run

1. Open http://localhost:3000 in your browser
2. Click **"Train Model"** on the Dashboard (auto-generates dataset + trains RandomForest)
3. Go to **Predict Student** and enter student details
4. View prediction, AI explanation, and recommendations
5. Go to **Teacher Analytics** for the full dashboard

---

## API Reference

| Method | Endpoint             | Description                                  |
|--------|----------------------|----------------------------------------------|
| GET    | `/api/health`        | System status + model readiness              |
| POST   | `/api/train`         | Train model (auto-generates dataset if needed)|
| POST   | `/api/predict`       | Predict + explain + advise a student         |
| GET    | `/api/dashboard`     | Aggregated teacher dashboard stats           |
| GET    | `/api/predictions`   | Paginated prediction history (filterable)    |
| GET    | `/api/dataset/info`  | Training dataset statistics                  |

---

## Dataset

The synthetic dataset (`student_data.csv`) contains **1500 rows** with the following columns:

| Column                  | Type   | Range   | Used in ML |
|-------------------------|--------|---------|------------|
| student_id              | string | —       | ✗ (identity) |
| student_name            | string | —       | ✗ (identity) |
| attendance_percentage   | float  | 0–100   | ✓ |
| internal_marks          | float  | 0–100   | ✓ |
| assignment_score        | float  | 0–100   | ✓ |
| study_hours_per_day     | float  | 0–12    | ✓ |
| performance_label       | string | —       | Target |

### Label Assignment Rules
- **Good**: attendance ≥ 75% AND marks ≥ 60 AND assignment ≥ 60 AND study ≥ 3 hrs
- **At Risk**: attendance < 55% OR marks < 38 OR (study < 1.5 AND assignment < 40)
- **Average**: everything else

---

## ML Model Details

- **Algorithm**: `RandomForestClassifier` (scikit-learn)
- **Estimators**: 200 trees
- **Class weights**: `balanced` (handles class imbalance)
- **Train/Test split**: 80/20 stratified
- **Cross-validation**: 5-fold
- **Features**: 4 academic metrics (no identity columns)
- **Output**: predicted class + class probabilities

---

## Existing vs Proposed System Comparison

| Feature                    | Existing (IEEE) | Proposed (This Project) |
|----------------------------|-----------------|------------------------|
| ML Prediction              | ✓               | ✓                      |
| Explanation of prediction  | ✗               | ✓ (AI-generated)       |
| Student advisory           | ✗               | ✓ (4 personalised tips)|
| Teacher dashboard          | ✗               | ✓ (charts + analytics) |
| Search & filter history    | ✗               | ✓                      |
| Edge case handling         | Limited         | ✓ (fallbacks, validation)|

---

## Edge Cases Handled

| Scenario                  | Handling                                      |
|---------------------------|-----------------------------------------------|
| Model not trained          | Auto-trains on first `/predict` call          |
| Dataset missing            | Auto-generates 1500-row synthetic CSV         |
| OpenAI API failure         | Rule-based explanation and advisory           |
| Invalid numeric input      | Pydantic validation + frontend error messages |
| Out-of-range values        | Range validators (0–100, 0–12)               |
| Empty prediction history   | Graceful empty-state UI                       |

---

*Final Year AI Project — AI-Based Student Performance Prediction and Advisory System*
