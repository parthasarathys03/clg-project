# AI-Based Student Performance Prediction and Advisory System

**Final Year AI Project** | IEEE-Enhanced Proposed System
**Domain:** Educational Data Mining · Machine Learning · Artificial Intelligence

---

## What This Project Is About (Simple Explanation)

Imagine a teacher has 60 students in a class. It is very hard for one teacher to track every student and identify who is struggling before exams. This system solves that problem.

**The system does four things automatically:**

1. A teacher enters basic student data — attendance, marks, assignment scores, study hours
2. The system uses Machine Learning to predict whether the student is **Good**, **Average**, or **At Risk**
3. The system uses AI (like ChatGPT) to explain **why** that prediction was made, in plain English
4. The system gives **4 personalised recommendations** to help the student improve

Additionally, the system groups all students into **behaviour clusters** so a teacher can see patterns — for example, which group of students studies less but still scores well, or which group is at risk as a whole.

This helps teachers take early action **before** a student fails — not after.

---

## IEEE Paper Reference

> **Paper Title:** *"Early Predicting of Students Performance in Higher Education"*
> **Source:** IEEE (2023)
> **What the paper did:** Used machine learning classification models (Logistic Regression, Decision Tree, Random Forest, etc.) to predict student academic performance based on collected educational data.

### What the IEEE Paper Did NOT Do (Limitations)

The IEEE paper was research-focused and had several gaps when applied in a real academic institution:

| Gap in IEEE Paper | Problem This Causes |
|---|---|
| Only predicted a label (Good/At Risk) | Teacher does not know **why** the prediction was made |
| No student advisory system | Student gets no guidance on **how to improve** |
| No teacher dashboard or UI | Results were only available in research reports, not real-time |
| No clustering / behaviour analysis | Patterns in student learning behaviour were never discovered |
| No search, filter, or history | Could not track a student's progress over multiple predictions |
| No batch processing | Had to evaluate students one at a time |
| No edge case handling | Extreme inputs could cause wrong predictions |

---

## What Our System Adds (How We Overcome IEEE Limitations)

| IEEE Limitation | Our Solution |
|---|---|
| No explanation of prediction | AI-generated explanation using GPT / rule-based fallback |
| No student advisory | 4 personalised, actionable study recommendations per student |
| No dashboard or UI | Full React web dashboard with charts, tables, analytics |
| No behaviour clustering | **t-SNE + KMeans** discovers hidden student learning patterns |
| No history or tracking | Complete prediction history with search and filter |
| No batch processing | CSV batch upload — predict hundreds of students at once |
| No edge case handling | Hard rules + Pydantic validation cover all extreme inputs |
| Single model only | Two learning approaches: Supervised (prediction) + Unsupervised (clustering) |

---

## System Architecture

```
Student Data (4 features)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│                   FastAPI Backend                     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         SUPERVISED LEARNING (Classification)  │   │
│  │  RandomForestClassifier (200 trees, sklearn)  │   │
│  │  Output: risk_level + confidence + factors    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         AI ADVISORY MODULE                    │   │
│  │  GPT-3.5-turbo OR rule-based fallback         │   │
│  │  Output: explanation + 4 recommendations      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │    UNSUPERVISED LEARNING (Clustering) [NEW]   │   │
│  │  t-SNE → 2D reduction + KMeans (k=3)          │   │
│  │  Output: behaviour groups + scatter plot      │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│              React Frontend Dashboard                 │
│  Dashboard · Predict · Teacher Analytics · Clusters  │
│  History · Batch Upload · Model Insights · Alerts    │
└──────────────────────────────────────────────────────┘
```

### Step-by-Step Workflow

```
Step 1 → Teacher enters:  Attendance %,  Internal Marks,  Assignment Score,  Study Hours
Step 2 → RandomForest predicts:   Good  |  Average  |  At Risk
Step 3 → AI explains WHY the prediction was made (in plain English)
Step 4 → AI gives 4 personalised recommendations for the student
Step 5 → Result saved to database, visible on Teacher Dashboard
Step 6 → Behaviour Clusters page shows how ALL students group together (unsupervised)
```

---

## Two Types of Machine Learning Used (Important for Viva)

### 1. Supervised Learning — Classification (Prediction)

- **What it is:** The model is trained on labelled data (we know the correct answer for each row)
- **Algorithm:** `RandomForestClassifier` — combines 200 decision trees and takes a majority vote
- **Input:** 4 features per student (attendance, marks, assignments, study hours)
- **Output:** One of three labels — `Good`, `Average`, `At Risk`
- **Why Random Forest?** It handles imbalanced classes, gives feature importance, and is robust to noise

### 2. Unsupervised Learning — Clustering (Behaviour Discovery)

- **What it is:** The model finds hidden patterns without being told correct answers — it groups similar students together
- **Step A — t-SNE:** Takes 4 features (high-dimensional) and compresses them into 2 numbers (X, Y) so they can be plotted on a 2D scatter chart. Each dot = one student.
- **Step B — KMeans:** Groups all students into 3 clusters based on similarity of their academic behaviour
- **Output:** 3 groups — High Performing, Average Learners, At-Risk Behaviour — labelled automatically from data averages, not hardcoded

> **Why two types?** The IEEE paper only used supervised learning. Adding unsupervised learning makes our system IEEE-compliant for both classification AND clustering requirements, and gives teachers a deeper picture of the class.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | Web interface — fast, component-based UI |
| Styling | Tailwind CSS | Utility-first CSS — clean dark design |
| Charts | Recharts | Line charts, bar charts, scatter plots |
| Backend | Python 3.10 + FastAPI | REST API server — high performance |
| Validation | Pydantic v2 | Auto-validates all input data |
| ML Engine | Scikit-learn 1.4.2 | RandomForest, t-SNE, KMeans, StandardScaler |
| AI Advisory | Google Gemini / rule-based fallback | Explanation and recommendations |
| Database | SQLite (via database.py) | Stores all prediction history |
| Data | Synthetic CSV — auto-generated | 1500+ student rows with labels |

---

## Project Folder Structure

```
clg-project/
│
├── backend/                          # Python FastAPI server
│   ├── main.py                       # All API routes (the main entry point)
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # API keys (not committed to git)
│   │
│   ├── models/
│   │   └── schemas.py                # Pydantic input/output shapes
│   │
│   ├── data/
│   │   ├── generate_dataset.py       # Generates synthetic student CSV
│   │   └── student_data.csv          # Auto-created when you train the model
│   │
│   ├── ml_model/                     # Supervised Learning (Classification)
│   │   ├── train.py                  # Trains RandomForestClassifier, saves model.pkl
│   │   ├── predict.py                # Loads model, runs prediction + hard rules
│   │   └── model.pkl                 # Saved trained model (auto-generated)
│   │
│   ├── ml_analysis/                  # Unsupervised Learning (Clustering) ← NEW
│   │   ├── __init__.py               # Package marker
│   │   ├── clustering.py             # t-SNE + KMeans full pipeline
│   │   └── analysis_service.py       # Caching layer (runs once per server start)
│   │
│   ├── ai_advisory/
│   │   └── advisor.py                # AI explanation + recommendations
│   │
│   └── database.py                   # SQLite operations (store/retrieve predictions)
│
├── frontend/                         # React + Vite web app
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx                   # Routes configuration
│       ├── main.jsx                  # React entry point
│       ├── api.js                    # All backend API calls (Axios)
│       ├── index.css                 # Global styles + Tailwind
│       │
│       ├── components/
│       │   ├── Layout.jsx            # Sidebar navigation + top bar
│       │   ├── StatCard.jsx          # Reusable metric card component
│       │   ├── RiskBadge.jsx         # Colour-coded Good/Average/At Risk badge
│       │   ├── LoadingSpinner.jsx    # Loading indicator
│       │   ├── Toast.jsx             # Notification pop-ups
│       │   ├── ExportButton.jsx      # CSV download button
│       │   ├── ImprovementDelta.jsx  # Progress change indicator
│       │   └── NotificationPanel.jsx # Alert notifications
│       │
│       └── pages/
│           ├── Dashboard.jsx         # Home: summary stats + recent predictions
│           ├── PredictPage.jsx       # Form to predict one student
│           ├── TeacherDashboard.jsx  # Full table: all students, search, filter
│           ├── StudentHistory.jsx    # Expandable prediction history per student
│           ├── BatchUploadPage.jsx   # Upload CSV to predict many students at once
│           ├── AnalyticsPage.jsx     # Charts and trends
│           ├── StudentProgressPage.jsx # Timeline of a single student's predictions
│           ├── ModelInsightsPage.jsx # Feature importances + training history
│           ├── StudentClusters.jsx   # t-SNE scatter plot + cluster cards ← NEW
│           └── AboutPage.jsx         # IEEE reference + system documentation
│
├── README.md                         # This file
├── start_backend.bat                 # Windows: double-click to start backend
└── start_frontend.bat                # Windows: double-click to start frontend
```

---

## How to Run the Project (Setup Instructions)

### Prerequisites

Make sure these are installed on your computer before starting:

- **Python 3.10 or higher** — [python.org](https://www.python.org/)
- **Node.js 18 or higher** — [nodejs.org](https://nodejs.org/)
- **npm** — comes with Node.js automatically

---

### Step 1 — Start the Backend

Open a terminal in the project folder and run:

```bash
cd backend

# Create a virtual environment (do this only once)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac / Linux:
source venv/bin/activate

# Install all Python dependencies (do this only once)
pip install -r requirements.txt

# Start the backend server
python main.py
```

The backend will start at: **http://localhost:8000**

You will see: `Uvicorn running on http://0.0.0.0:8000`

> **OpenAI API Key (optional):** If you have an OpenAI key, create a `.env` file inside the `backend/` folder and add: `OPENAI_API_KEY=sk-...`
> Without it, the system uses a smart rule-based fallback — the prediction still works perfectly.

---

### Step 2 — Start the Frontend

Open a **second terminal** and run:

```bash
cd frontend

# Install Node.js packages (do this only once)
npm install

# Start the frontend dev server
npm run dev
```

The frontend will start at: **http://localhost:5173** (or 3000)

---

### Step 3 — First Time Use

1. Open **http://localhost:5173** in your browser
2. Click **"Train Model"** on the Dashboard
   - This auto-generates the student dataset and trains the RandomForest model
   - Takes about 10–15 seconds
3. Go to **Predict Student** — enter a student's details and see the prediction
4. Go to **Behaviour Clusters** — view the t-SNE scatter plot and cluster cards
   - **First load takes 20–60 seconds** (t-SNE computation) — then it is cached instantly
5. Go to **Teacher Analytics** to see all stored predictions

---

## All API Endpoints

| Method | Endpoint | What It Does |
|---|---|---|
| GET | `/api/health` | Check if server and model are ready |
| POST | `/api/train` | Train the ML model (generates dataset if missing) |
| POST | `/api/predict` | Predict one student + get AI explanation + advice |
| GET | `/api/dashboard` | Summary stats for teacher dashboard |
| GET | `/api/predictions` | All predictions (paginated, filterable by risk level) |
| DELETE | `/api/predictions/{id}` | Delete one prediction record |
| GET | `/api/dataset/info` | Dataset row count, label distribution, feature stats |
| POST | `/api/batch-upload` | Upload CSV → predict all students in bulk |
| GET | `/api/student/{id}/progress` | One student's full prediction history over time |
| GET | `/api/alerts` | Students who were "At Risk" in multiple consecutive predictions |
| GET | `/api/rankings` | All students ranked by composite academic score |
| GET | `/api/export` | Download all predictions as a CSV file |
| GET | `/api/model/insights` | Feature importances + training accuracy history |
| GET | `/api/training-history` | List of all past model training runs |
| **GET** | **`/api/student-clusters`** | **t-SNE + KMeans cluster analysis (IEEE)** ← NEW |

### Student Clusters Endpoint — Response Format

```json
{
  "total_students": 1500,
  "clusters": [
    {
      "cluster_id": 0,
      "student_count": 520,
      "avg_attendance": 87.4,
      "avg_marks": 78.2,
      "avg_assignments": 80.1,
      "avg_study_hours": 5.3,
      "interpretation": "High Performing Group"
    },
    {
      "cluster_id": 1,
      "student_count": 610,
      "avg_attendance": 71.3,
      "avg_marks": 58.7,
      "avg_assignments": 61.2,
      "avg_study_hours": 3.1,
      "interpretation": "Average Learners Group"
    },
    {
      "cluster_id": 2,
      "student_count": 370,
      "avg_attendance": 48.2,
      "avg_marks": 34.5,
      "avg_assignments": 38.0,
      "avg_study_hours": 1.2,
      "interpretation": "At-Risk Behaviour Group"
    }
  ],
  "points": [
    { "x": -12.34, "y": 8.91, "cluster": 0 },
    { "x":  4.21,  "y": -3.54, "cluster": 2 }
  ]
}
```

> Add `?refresh=true` to force recompute: `GET /api/student-clusters?refresh=true`

---

## Dataset Details

The system uses a **synthetic (computer-generated) dataset** called `student_data.csv`.

It is auto-created when you click "Train Model". You do not need to collect real data.

### Dataset Columns

| Column | Type | Range | Used in ML? | Purpose |
|---|---|---|---|---|
| student_id | string | — | No | Identity only |
| student_name | string | — | No | Identity only |
| attendance_percentage | float | 0 – 100 | **Yes** | Key learning indicator |
| internal_marks | float | 0 – 100 | **Yes** | Academic performance |
| assignment_score | float | 0 – 100 | **Yes** | Consistency measure |
| study_hours_per_day | float | 0 – 12 | **Yes** | Effort indicator |
| performance_label | string | — | Target | Good / Average / At Risk |

### How Labels Are Assigned in the Dataset

| Label | Rule |
|---|---|
| **Good** | Attendance ≥ 75% AND Marks ≥ 60 AND Assignment ≥ 60 AND Study ≥ 3 hrs/day |
| **At Risk** | Attendance < 55% OR Marks < 38 OR (Study < 1.5 AND Assignment < 40) |
| **Average** | Everything else that does not fit Good or At Risk |

---

## ML Model Details — Supervised Learning (Prediction)

| Parameter | Value | Why |
|---|---|---|
| Algorithm | RandomForestClassifier | Robust, handles imbalance, gives feature importance |
| Number of Trees | 200 | More trees = more stable prediction |
| Class Weights | balanced | Handles unequal Good/Average/At Risk distribution |
| Train/Test Split | 80% train, 20% test | Standard machine learning split |
| Cross-Validation | 5-fold CV | Confirms model generalises, not just memorises |
| Features Used | 4 academic metrics | No student name or ID — avoids bias |
| Output | Predicted class + probabilities | Transparent result, not just a label |

### Hard Rules (Post-Model Logic)

After the RandomForest gives a prediction, the system applies institutional rules to catch extreme edge cases:

| Rule | Condition | Override |
|---|---|---|
| 1 | Attendance < 50% | Force → **At Risk** (barred from exams) |
| 2 | Internal marks < 35% | Force → **At Risk** |
| 3 | Assignment score < 35% | Force → **At Risk** |
| 4 | Study < 1.5 hrs AND attendance < 75% | Force → **At Risk** |
| 5 | 3 or more metrics below threshold | Force → **At Risk** |
| 6 | Predicted "Good" but attendance < 75% | Downgrade → **Average** |

---

## Clustering Module Details — Unsupervised Learning (Behaviour Analysis)

This is the **NEW module** added to meet the IEEE paper's dual-learning requirement.

### Why Clustering?

Supervised learning tells us: *"This student is At Risk."*
Clustering tells us: *"There are 370 students who all behave in a similar at-risk way — what do they have in common?"*

This helps teachers design group interventions instead of addressing each student individually.

### How t-SNE Works (Simple Explanation)

Each student has 4 numbers (attendance, marks, assignments, study hours) — this is 4-dimensional data that cannot be plotted on a 2D screen.

**t-SNE (t-Distributed Stochastic Neighbour Embedding)** mathematically compresses those 4 numbers into just 2 numbers (X and Y) while **preserving the neighbourhood structure** — students who are similar in real data end up close together on the 2D plot.

```
4D data (per student):       t-SNE output (per student):
[attendance, marks,          →      [x, y]
 assignment, study_hours]           (plottable on screen)
```

### How KMeans Works (Simple Explanation)

KMeans picks 3 centre points, then assigns every student to the nearest centre. It repeats this process until the groups stabilise. Each group = one cluster.

```
All students  →  KMeans (k=3)  →  Cluster 0, Cluster 1, Cluster 2
```

### How Cluster Names Are Determined (No Hardcoding)

The system does NOT hardcode which cluster is "High Performing". Instead:

1. Calculate the average attendance, marks, assignments, study hours for each cluster
2. Normalise those averages so every feature contributes equally
3. Compute a **composite score** = average of all normalised feature means
4. Rank clusters: highest composite → "High Performing Group", lowest → "At-Risk Behaviour Group"

This means the labels are always derived from the actual data, not preset.

### Clustering Configuration

| Parameter | Value |
|---|---|
| t-SNE components | 2 (for 2D scatter plot) |
| t-SNE perplexity | 30 (standard for student-sized datasets) |
| t-SNE random state | 42 (reproducible results) |
| KMeans clusters (k) | 3 (Good / Average / At-Risk behaviour groups) |
| KMeans random state | 42 |
| Feature scaling | StandardScaler (zero mean, unit variance) |
| Max sample size | 2000 rows (subsampled if dataset is larger, for speed) |
| Caching | Results cached in memory — computed once per server start |

---

## Existing vs Proposed System — Full Comparison

| Feature | IEEE Paper (Existing) | Our System (Proposed) |
|---|---|---|
| Student risk prediction | ✓ | ✓ |
| AI explanation of prediction | ✗ | ✓ AI-generated in plain English |
| Personalised study advisory | ✗ | ✓ 4 actionable recommendations |
| Teacher web dashboard | ✗ | ✓ Real-time charts and tables |
| Dimensionality reduction (t-SNE) | ✗ | ✓ 2D scatter visualisation |
| Behaviour clustering (KMeans) | ✗ | ✓ 3 auto-labelled student groups |
| Prediction history & tracking | ✗ | ✓ Full history with search + filter |
| Batch CSV upload | ✗ | ✓ Predict hundreds of students at once |
| Student progress timeline | ✗ | ✓ Per-student trend over time |
| Consecutive at-risk alerts | ✗ | ✓ Flags students needing urgent help |
| Student rankings | ✗ | ✓ Composite score leaderboard |
| CSV export | ✗ | ✓ Download all predictions |
| Feature importance analysis | ✗ | ✓ See which factor matters most |
| Edge case handling | Limited | ✓ Hard rules + validation |
| Works without API key | ✗ | ✓ Rule-based fallback always works |

---

## Edge Cases and How They Are Handled

| Situation | What Happens |
|---|---|
| Model not yet trained | Auto-trains on first `/predict` call — no error |
| Dataset CSV is missing | Auto-generates 1500-row synthetic CSV |
| OpenAI / Gemini API key missing | Falls back to smart rule-based explanation |
| Clustering requested before training | Returns clear 503 error with instructions |
| Invalid input (e.g. text in marks field) | Pydantic rejects it with a clear error message |
| Out-of-range values (e.g. attendance = 150) | Range validators block it before reaching the model |
| No students in prediction history | Dashboard shows a graceful empty-state message |
| t-SNE very slow on first run | Results are cached — only runs once per server session |

---

## Pages in the Web Application

| Page | URL | What It Shows |
|---|---|---|
| Dashboard | `/dashboard` | Summary stats, recent predictions, quick-train button |
| Predict Student | `/predict` | Form to enter student details and get prediction |
| Teacher Analytics | `/teacher` | Full table of all predictions, search, filter by risk |
| Student History | `/history` | Grouped view of all students' prediction records |
| Behaviour Clusters | `/clusters` | t-SNE scatter plot + KMeans cluster summary cards |
| Batch Upload | `/batch` | Upload a CSV file to run predictions in bulk |
| Analytics | `/analytics` | Charts: risk distribution, trends over time |
| Model Insights | `/insights` | Feature importance bars + training accuracy history |
| Student Progress | `/student/:id` | One student's risk level timeline over multiple entries |
| About / IEEE | `/about` | Project documentation, IEEE paper reference |

---

## How to Explain This to Your Teacher (Quick Summary)

**Supervised Learning part:**
> "We trained a Random Forest on 1500 student records. The model learns which combination of attendance, marks, assignments, and study hours leads to good or poor performance. When a teacher enters a new student's data, the model predicts their risk level and an AI module explains the reason and gives personalised advice."

**Unsupervised Learning part:**
> "We added a clustering module that uses t-SNE and KMeans — two standard algorithms from the IEEE paper's domain. t-SNE compresses the 4 student features into 2D coordinates so we can plot every student on a scatter chart. KMeans then automatically groups students into 3 behaviour clusters without being told what the groups are. This reveals hidden patterns in the class that even the teacher might not notice."

**Why this is better than the IEEE paper:**
> "The IEEE paper only predicted a label. Our system explains why, advises what to do, shows behaviour patterns through clustering, and gives teachers a complete real-time dashboard — making it a complete academic decision-support system, not just a research model."

---

## Future Improvements (Scope for Extension)

- Add real student data integration (with college student information system)
- Add semester-wise prediction trend analysis
- Add email alerts to students directly
- Support multi-language advisory (regional language recommendations)
- Add SHAP explainability for deeper feature-level explanation
- Support more clustering algorithms (DBSCAN, Hierarchical Clustering)

---

*Final Year AI Project — AI-Based Student Performance Prediction and Advisory System*
*IEEE Enhanced | Supervised + Unsupervised Learning | FastAPI + React*
