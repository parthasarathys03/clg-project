"""
Synthetic Dataset Generator
============================
Generates a realistic academic dataset of 1500 student records.

Label Logic (deterministic rule-based to ensure reproducibility):
  - Good      : attendance >= 75 AND internal_marks >= 60 AND assignment_score >= 60 AND study_hours >= 3
  - At Risk   : attendance < 60  OR  internal_marks < 40  OR  (study_hours < 1.5 AND assignment_score < 40)
  - Average   : everything else

Feature columns used for ML training (NO identity columns):
  attendance_percentage, internal_marks, assignment_score, study_hours_per_day
"""

import numpy as np
import pandas as pd
import os
import random
import string


DATASET_PATH = os.path.join(os.path.dirname(__file__), "student_data.csv")
RANDOM_SEED = 42


def _generate_student_id(idx: int) -> str:
    return f"STU{idx:04d}"


def _generate_name() -> str:
    first_names = [
        "Aarav", "Ananya", "Arjun", "Bhavna", "Chirag", "Deepak",
        "Divya", "Farhan", "Geeta", "Harish", "Isha", "Jaideep",
        "Kavita", "Lokesh", "Meera", "Nikhil", "Pooja", "Rahul",
        "Sakshi", "Tanvi", "Uday", "Varsha", "Vivek", "Yashika",
        "Zara", "Aditya", "Bharat", "Chetan", "Diya", "Eshan",
        "Fiza", "Gaurav", "Hina", "Irfan", "Jaya", "Karan",
        "Lata", "Manish", "Naina", "Om", "Priya", "Qasim",
        "Ritu", "Sanjay", "Tara", "Uma", "Veer", "Waqar",
    ]
    last_names = [
        "Sharma", "Verma", "Singh", "Patel", "Kumar", "Gupta",
        "Joshi", "Mishra", "Yadav", "Nair", "Menon", "Pillai",
        "Reddy", "Iyer", "Rao", "Bhat", "Shah", "Mehta",
        "Sinha", "Dubey", "Tiwari", "Pandey", "Kapoor", "Malhotra",
    ]
    return f"{random.choice(first_names)} {random.choice(last_names)}"


def _assign_label(row: dict) -> str:
    att = row["attendance_percentage"]
    marks = row["internal_marks"]
    assign = row["assignment_score"]
    hours = row["study_hours_per_day"]

    if att >= 75 and marks >= 60 and assign >= 60 and hours >= 3.0:
        return "Good"
    if att < 55 or marks < 38 or (hours < 1.5 and assign < 40):
        return "At Risk"
    return "Average"


def generate_dataset(n_samples: int = 1500, save: bool = True) -> pd.DataFrame:
    np.random.seed(RANDOM_SEED)
    random.seed(RANDOM_SEED)

    records = []

    # ── Segment 1: High-performing students (≈35 %) ──────────────────────
    n_good = int(n_samples * 0.35)
    for i in range(n_good):
        rec = {
            "attendance_percentage": round(np.random.uniform(75, 100), 1),
            "internal_marks":        round(np.random.uniform(62, 100), 1),
            "assignment_score":      round(np.random.uniform(60, 100), 1),
            "study_hours_per_day":   round(np.random.uniform(3.0, 8.0), 1),
        }
        records.append(rec)

    # ── Segment 2: At-risk students (≈25 %) ──────────────────────────────
    n_risk = int(n_samples * 0.25)
    for i in range(n_risk):
        risk_type = random.choice(["low_att", "low_marks", "both_low"])
        if risk_type == "low_att":
            rec = {
                "attendance_percentage": round(np.random.uniform(20, 54), 1),
                "internal_marks":        round(np.random.uniform(30, 75), 1),
                "assignment_score":      round(np.random.uniform(20, 65), 1),
                "study_hours_per_day":   round(np.random.uniform(0.5, 4.0), 1),
            }
        elif risk_type == "low_marks":
            rec = {
                "attendance_percentage": round(np.random.uniform(45, 80), 1),
                "internal_marks":        round(np.random.uniform(5, 37), 1),
                "assignment_score":      round(np.random.uniform(10, 50), 1),
                "study_hours_per_day":   round(np.random.uniform(0.5, 3.0), 1),
            }
        else:
            rec = {
                "attendance_percentage": round(np.random.uniform(20, 58), 1),
                "internal_marks":        round(np.random.uniform(5, 45), 1),
                "assignment_score":      round(np.random.uniform(5, 38), 1),
                "study_hours_per_day":   round(np.random.uniform(0.0, 1.4), 1),
            }
        records.append(rec)

    # ── Segment 3: Average students (remaining ≈40 %) ────────────────────
    n_avg = n_samples - n_good - n_risk
    for i in range(n_avg):
        rec = {
            "attendance_percentage": round(np.random.uniform(55, 80), 1),
            "internal_marks":        round(np.random.uniform(38, 65), 1),
            "assignment_score":      round(np.random.uniform(38, 68), 1),
            "study_hours_per_day":   round(np.random.uniform(1.5, 4.5), 1),
        }
        records.append(rec)

    # Shuffle rows
    random.shuffle(records)

    df = pd.DataFrame(records)
    df["performance_label"] = df.apply(_assign_label, axis=1)

    # Add identity columns (NOT used in ML)
    df.insert(0, "student_id",   [_generate_student_id(i + 1) for i in range(len(df))])
    df.insert(1, "student_name", [_generate_name() for _ in range(len(df))])

    if save:
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        df.to_csv(DATASET_PATH, index=False)
        print(f"[Dataset] Saved {len(df)} rows -> {DATASET_PATH}")
        print(f"[Dataset] Label distribution:\n{df['performance_label'].value_counts().to_string()}")

    return df


if __name__ == "__main__":
    df = generate_dataset()
    print(df.head())
