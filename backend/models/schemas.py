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

    @validator("student_id")
    def student_id_alphanumeric(cls, v):
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("student_id must be alphanumeric")
        return v

    @validator("student_name")
    def name_no_digits(cls, v):
        if any(c.isdigit() for c in v):
            raise ValueError("student_name must not contain digits")
        return v.strip()


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
