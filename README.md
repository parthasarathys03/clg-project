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
| No explanation of prediction | AI-generated explanation using Gemini / rule-based fallback |
| No student advisory | 4 personalised, actionable study recommendations per student |
| No dashboard or UI | Full React web dashboard with charts, tables, analytics |
| No behaviour clustering | **t-SNE + KMeans** discovers hidden student learning patterns |
| No cluster validation | **Elbow Method + Silhouette Score** for k=2..8 — optimal k auto-selected |
| No cluster justification | Elbow curve + silhouette bar chart shown in UI for academic transparency |
| No teacher cluster context | Rule-based **cluster insights** explain each group in plain English |
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
│  │    UNSUPERVISED LEARNING (Clustering)         │   │
│  │  Elbow + Silhouette Validation (k=2..8)       │   │
│  │  Auto k-selection → t-SNE + KMeans            │   │
│  │  Output: clusters + validation + insights     │   │
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
Step 6 → Behaviour Clusters: Elbow + Silhouette sweep (k=2..8) → auto-select optimal k
Step 7 → t-SNE reduces 4D data to 2D scatter plot → KMeans groups students into optimal clusters
Step 8 → Rule-based insights explain each cluster to the teacher in plain English
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
- **Step A — Cluster Validation:** Elbow Method + Silhouette Score are computed for k=2 to k=8. The optimal k is automatically selected as the k with the highest silhouette score (best cluster separation). This provides mathematical justification for the cluster count.
- **Step B — t-SNE:** Takes 4 features (high-dimensional) and compresses them into 2 numbers (X, Y) so they can be plotted on a 2D scatter chart. Each dot = one student.
- **Step C — KMeans:** Groups all students into the optimal k clusters based on similarity of academic behaviour. Labels are assigned by ranking composite feature averages — not hardcoded.
- **Step D — Cluster Insights:** Each cluster receives a rule-based 2–3 sentence teacher-friendly explanation derived from its average feature values.
- **Output:** Auto-labelled student groups + elbow curve + silhouette scores + per-cluster insights

> **Why two types?** The IEEE paper only used supervised learning. Adding unsupervised learning with full mathematical validation makes our system IEEE-compliant for both classification AND clustering requirements, and gives teachers a deeper, justified picture of the class.

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
  "total_students": 2000,
  "optimal_k": 3,
  "validation": {
    "k_values": [2, 3, 4, 5, 6, 7, 8],
    "inertias": [4006.86, 2356.0, 2021.93, 1803.86, 1630.83, 1487.28, 1397.7],
    "silhouette_scores": [0.3955, 0.4347, 0.337, 0.3267, 0.3459, 0.2971, 0.2954],
    "optimal_k": 3,
    "optimal_silhouette": 0.4347,
    "selection_method": "Optimal number of clusters selected based on silhouette score. k=3 provides the best cluster separation (silhouette = 0.435)."
  },
  "clusters": [
    {
      "cluster_id": 0,
      "student_count": 520,
      "avg_attendance": 87.4,
      "avg_marks": 78.2,
      "avg_assignments": 80.1,
      "avg_study_hours": 5.3,
      "interpretation": "High Performing Group",
      "insight": "Students in this group maintain strong academic metrics — 87.4% average attendance and 78.2% internal marks. They study approximately 5.3 hours per day and complete 80.1% of assignments. This cohort is on track and may benefit from advanced enrichment or peer-leadership opportunities."
    },
    {
      "cluster_id": 1,
      "student_count": 610,
      "avg_attendance": 71.3,
      "avg_marks": 58.7,
      "avg_assignments": 61.2,
      "avg_study_hours": 3.1,
      "interpretation": "Average Learners Group",
      "insight": "Students in this group show moderate academic engagement — 71.3% attendance and 58.7% marks on average. They study 3.1 hours per day and score 61.2% on assignments. Targeted academic support and motivation strategies can help transition this group to a higher performance tier."
    },
    {
      "cluster_id": 2,
      "student_count": 370,
      "avg_attendance": 48.2,
      "avg_marks": 34.5,
      "avg_assignments": 38.0,
      "avg_study_hours": 1.2,
      "interpretation": "At-Risk Behaviour Group",
      "insight": "Students in this group show low engagement patterns — 48.2% attendance and 34.5% internal marks on average. With only 1.2 hours of daily study and 38.0% assignment completion, they risk academic underperformance. Immediate faculty attention, counselling, and structured peer-mentoring are strongly recommended."
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

This module meets the IEEE paper's dual-learning requirement and adds full **mathematical cluster validation**.

### Why Clustering?

Supervised learning tells us: *"This student is At Risk."*
Clustering tells us: *"There are 370 students who all behave in a similar at-risk way — what do they have in common?"*

This helps teachers design group interventions instead of addressing each student individually.

---

### Cluster Validation — Elbow Method + Silhouette Score (New)

Before running the main clustering, the system evaluates every k from 2 to 8:

#### Elbow Method
- Fits KMeans for each k and records **inertia** (sum of squared distances from points to their cluster centre)
- Plotting inertia vs k produces an "elbow" — the point where adding more clusters gives diminishing improvement
- A lower inertia is better, but the goal is finding the "knee" of the curve

#### Silhouette Score
- For each k, computes the **silhouette score** — a value between 0 and 1 that measures how well each student fits its own cluster vs neighbouring clusters
- Score near 1 → student is clearly in the right cluster
- Score near 0 → student is on the border between two clusters
- The k with the **highest silhouette score** is automatically selected as the optimal k

```
k=2  silhouette=0.39  inertia=4006
k=3  silhouette=0.43  ← OPTIMAL (highest)   inertia=2356
k=4  silhouette=0.34  inertia=2021
...
```

Both the elbow curve and silhouette bar chart are displayed in the UI so teachers and evaluators can verify the selection.

---

### How t-SNE Works (Simple Explanation)

Each student has 4 numbers (attendance, marks, assignments, study hours) — this is 4-dimensional data that cannot be plotted on a 2D screen.

**t-SNE (t-Distributed Stochastic Neighbour Embedding)** mathematically compresses those 4 numbers into just 2 numbers (X and Y) while **preserving the neighbourhood structure** — students who are similar in real data end up close together on the 2D plot.

```
4D data (per student):       t-SNE output (per student):
[attendance, marks,          →      [x, y]
 assignment, study_hours]           (plottable on screen)
```

### How KMeans Works (Simple Explanation)

KMeans picks k centre points, then assigns every student to the nearest centre. It repeats until the groups stabilise. Each group = one cluster. The k is chosen automatically by silhouette analysis.

```
All students  →  Silhouette sweep (k=2..8)  →  optimal k  →  KMeans  →  Cluster 0 … k-1
```

### How Cluster Names Are Determined (No Hardcoding)

The system does NOT hardcode which cluster is "High Performing". Instead:

1. Calculate the average attendance, marks, assignments, study hours for each cluster
2. Normalise those averages so every feature contributes equally
3. Compute a **composite score** = average of all normalised feature means
4. Rank clusters: highest composite → "High Performing Group", lowest → "At-Risk Behaviour Group"

Labels adapt to any k — the system generates appropriate labels for k=2 through k=8.

### How Cluster Insights Are Generated

Each cluster receives a rule-based 2–3 sentence plain-English explanation:

- **High Performing** → notes strong attendance and marks, suggests enrichment activities
- **At-Risk** → highlights low engagement, recommends immediate counselling and peer mentoring
- **Average / Middle tiers** → describes moderate engagement, suggests targeted support strategies

All text is generated from the actual cluster averages — not hardcoded strings.

### Clustering Configuration

| Parameter | Value |
|---|---|
| Validation sweep | k = 2 to 8 (Elbow Method + Silhouette Score) |
| Optimal k selection | Highest silhouette score (auto) |
| t-SNE components | 2 (for 2D scatter plot) |
| t-SNE perplexity | 30 (standard for student-sized datasets) |
| t-SNE random state | 42 (reproducible results) |
| KMeans k | Auto-selected from validation sweep |
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
| Behaviour clustering (KMeans) | ✗ | ✓ Auto-labelled student groups (optimal k) |
| Cluster validation (Elbow + Silhouette) | ✗ | ✓ k=2..8 sweep, optimal k auto-selected |
| Cluster insights for teachers | ✗ | ✓ Rule-based plain-English explanation per cluster |
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
| Behaviour Clusters | `/clusters` | t-SNE scatter plot + cluster validation (elbow curve + silhouette) + cluster insights |
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
> "We added a clustering module that uses t-SNE and KMeans — two standard algorithms from the IEEE paper's domain. Before clustering, the system runs the Elbow Method and computes Silhouette Scores for k=2 to k=8, then automatically selects the optimal cluster count based on the highest silhouette score. t-SNE then compresses the 4 student features into 2D coordinates so we can plot every student on a scatter chart. KMeans groups students into the optimal number of behaviour clusters. Each cluster also gets a plain-English insight explaining what that group's behaviour pattern means for teachers."

**Why this is better than the IEEE paper:**
> "The IEEE paper only predicted a label. Our system explains why, advises what to do, shows mathematically validated behaviour patterns through clustering (with elbow curve and silhouette score proof), and gives teachers a complete real-time dashboard with actionable cluster insights — making it a complete academic decision-support system, not just a research model."

---

## Future Improvements (Scope for Extension)

- Add real student data integration (with college student information system)
- Add semester-wise prediction trend analysis
- Add email alerts to students directly
- Support multi-language advisory (regional language recommendations)
- Add SHAP explainability for deeper feature-level explanation
- Support more clustering algorithms (DBSCAN, Hierarchical Clustering)
- Add Gap Statistic method as an additional cluster count selector alongside silhouette
- Persist cluster validation results to database for historical comparison

---

*Final Year AI Project — AI-Based Student Performance Prediction and Advisory System*
*IEEE Enhanced | Supervised + Unsupervised Learning | FastAPI + React*
