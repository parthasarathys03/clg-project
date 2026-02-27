from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class StudentInput(BaseModel):
    student_id: str = Field(..., min_length=1, max_length=20)
    student_name: str = Field(..., min_length=2, max_length=100)
    attendance_percentage: float = Field(..., ge=0, le=100)
    internal_marks: float = Field(..., ge=0, le=100)
    assignment_score: float = Field(..., ge=0, le=100)
    study_hours_per_day: float = Field(..., ge=0, le=12)
    section:      Optional[str] = None
    department:   Optional[str] = None
    current_year: Optional[int] = Field(None, ge=1, le=4)

    @validator("student_id")
    def student_id_alphanumeric(cls, v):
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("student_id must be alphanumeric")
        return v

    @validator("student_name")
    def name_no_digits(cls, v):
        stripped = v.strip()
        # Reject only if the name contains NO letters at all (pure numeric / symbol input)
        if not any(c.isalpha() for c in stripped):
            raise ValueError("student_name must contain at least one letter")
        return stripped

    @validator("section")
    def section_valid(cls, v):
        if v is not None and v not in ("IT-A", "IT-B", "IT-C"):
            raise ValueError("section must be IT-A, IT-B, or IT-C")
        return v


class PredictionResult(BaseModel):
    student_id: str
    student_name: str
    risk_level: str               # Good | Average | At Risk
    confidence: float             # 0.0–1.0
    probabilities: dict           # {Good: x, Average: y, At Risk: z}
    key_factors: List[str]
    timestamp: str


class ExplanationRequest(BaseModel):
    student_input: StudentInput
    prediction: PredictionResult


class ExplanationResponse(BaseModel):
    explanation: str
    recommendations: List[str]
    fallback_used: bool = False


class DashboardStats(BaseModel):
    total_students: int
    risk_distribution: dict       # {Good: n, Average: n, At Risk: n}
    average_attendance: float
    average_internal_marks: float
    average_assignment_score: float
    average_study_hours: float
    recent_predictions: List[dict]


class TrainResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    message: str
    accuracy: float
    model_path: str
    dataset_rows: int
    feature_importances: dict


class BatchUploadResponse(BaseModel):
    batch_id: str
    filename: str
    total: int
    processed: int
    results: List[dict]


class AlertStudent(BaseModel):
    student_id: str
    student_name: str
    risk_level: str
    confidence: float
    consecutive_at_risk: int
    last_seen: str


class AlertsResponse(BaseModel):
    count: int
    students: List[AlertStudent]


class StudentProgressResponse(BaseModel):
    student_id: str
    student_name: str
    history: List[dict]
    total: int


class RankingEntry(BaseModel):
    rank: int
    student_id: str
    student_name: str
    risk_level: str
    confidence: float
    composite_score: float
    inputs: dict
    timestamp: str


class RankingsResponse(BaseModel):
    total: int
    rankings: List[RankingEntry]


class TrainingHistoryEntry(BaseModel):
    id: int
    accuracy: float
    cv_score: Optional[float]
    dataset_rows: Optional[int]
    feature_importances: dict
    trained_at: str


class ModelInsightsResponse(BaseModel):
    feature_importances: dict
    training_history: List[TrainingHistoryEntry]
    current_accuracy: Optional[float]
    last_trained: Optional[str]
