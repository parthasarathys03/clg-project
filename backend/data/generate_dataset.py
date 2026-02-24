"""
Synthetic Dataset Generator
============================
Generates a realistic academic dataset of 10,000 student records.

Design goals:
  - Realistic class overlap so ML accuracy lands ~85-90% (not 99%)
  - Real-world contradictory patterns (high attendance + low marks, etc.)
  - Borderline students near decision boundaries
  - ~5% label noise to simulate human grading inconsistency
  - Three balanced but realistic segments

Label classes:
  Good    : strong academic profile
  Average : middle-range, needs monitoring
  At Risk : high intervention needed

Feature columns used for ML training (NO identity columns):
  attendance_percentage, internal_marks, assignment_score, study_hours_per_day
"""

import numpy as np
import pandas as pd
import os
import random


DATASET_PATH = os.path.join(os.path.dirname(__file__), "student_data.csv")
RANDOM_SEED  = 42

# ── Label noise rate: % of labels randomly flipped to simulate real-world ──
LABEL_NOISE_RATE = 0.03


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
        "Amita", "Bhaskar", "Chetna", "Dhruv", "Ekta", "Farida",
        "Girish", "Heena", "Ishan", "Juhi", "Kishore", "Lavanya",
        "Mohan", "Neha", "Omkar", "Pankaj", "Reema", "Suresh",
    ]
    last_names = [
        "Sharma", "Verma", "Singh", "Patel", "Kumar", "Gupta",
        "Joshi", "Mishra", "Yadav", "Nair", "Menon", "Pillai",
        "Reddy", "Iyer", "Rao", "Bhat", "Shah", "Mehta",
        "Sinha", "Dubey", "Tiwari", "Pandey", "Kapoor", "Malhotra",
        "Saxena", "Agarwal", "Chaudhary", "Bhatt", "Rajan", "Naik",
    ]
    return f"{random.choice(first_names)} {random.choice(last_names)}"


def _clip(value: float, lo: float, hi: float) -> float:
    return round(max(lo, min(hi, value)), 1)


def generate_dataset(n_samples: int = 10000, save: bool = True) -> pd.DataFrame:
    np.random.seed(RANDOM_SEED)
    random.seed(RANDOM_SEED)

    records = []
    labels  = []

    # ═══════════════════════════════════════════════════════════════════════
    # SEGMENT 1 — Clearly Good students (25 %)
    # Well above all thresholds — model should classify these correctly
    # ═══════════════════════════════════════════════════════════════════════
    n1 = int(n_samples * 0.25)
    for _ in range(n1):
        rec = {
            "attendance_percentage": _clip(np.random.normal(85, 7),   76, 100),
            "internal_marks":        _clip(np.random.normal(76, 8),   65, 100),
            "assignment_score":      _clip(np.random.normal(74, 8),   63, 100),
            "study_hours_per_day":   _clip(np.random.normal(5.2, 1.3), 3.5, 10),
        }
        records.append(rec)
        labels.append("Good")

    # ═══════════════════════════════════════════════════════════════════════
    # SEGMENT 2 — Clearly At Risk students (20 %)
    # Well below thresholds — model should classify these correctly
    # ═══════════════════════════════════════════════════════════════════════
    n2 = int(n_samples * 0.20)
    for _ in range(n2):
        rec = {
            "attendance_percentage": _clip(np.random.normal(38, 9),   15, 54),
            "internal_marks":        _clip(np.random.normal(30, 9),   5,  46),
            "assignment_score":      _clip(np.random.normal(28, 9),   5,  44),
            "study_hours_per_day":   _clip(np.random.normal(1.0, 0.5), 0,  2.0),
        }
        records.append(rec)
        labels.append("At Risk")

    # ═══════════════════════════════════════════════════════════════════════
    # SEGMENT 3 — Clearly Average students (20 %)
    # Mid-range values comfortably in average zone
    # ═══════════════════════════════════════════════════════════════════════
    n3 = int(n_samples * 0.20)
    for _ in range(n3):
        rec = {
            "attendance_percentage": _clip(np.random.normal(65, 5),   56, 74),
            "internal_marks":        _clip(np.random.normal(53, 6),   42, 63),
            "assignment_score":      _clip(np.random.normal(52, 6),   40, 63),
            "study_hours_per_day":   _clip(np.random.normal(2.8, 0.7), 1.8, 4.0),
        }
        records.append(rec)
        labels.append("Average")

    # ═══════════════════════════════════════════════════════════════════════
    # SEGMENT 4 — Borderline Good / Average (6 %)
    # Students sitting RIGHT at the Good threshold — genuinely ambiguous
    # ═══════════════════════════════════════════════════════════════════════
    n4 = int(n_samples * 0.06)
    for _ in range(n4):
        rec = {
            "attendance_percentage": _clip(np.random.normal(75, 3),   68, 82),
            "internal_marks":        _clip(np.random.normal(61, 3),   55, 68),
            "assignment_score":      _clip(np.random.normal(61, 3),   55, 68),
            "study_hours_per_day":   _clip(np.random.normal(3.1, 0.5), 2.2, 4.0),
        }
        records.append(rec)
        # Randomly assign Good or Average — creates irreducible confusion
        labels.append(random.choice(["Good", "Average"]))

    # ═══════════════════════════════════════════════════════════════════════
    # SEGMENT 5 — Borderline Average / At Risk (6 %)
    # Near the At Risk threshold — genuinely ambiguous
    # ═══════════════════════════════════════════════════════════════════════
    n5 = int(n_samples * 0.06)
    for _ in range(n5):
        rec = {
            "attendance_percentage": _clip(np.random.normal(58, 3),   50, 66),
            "internal_marks":        _clip(np.random.normal(44, 3),   37, 52),
            "assignment_score":      _clip(np.random.normal(43, 3),   36, 51),
            "study_hours_per_day":   _clip(np.random.normal(1.8, 0.4), 1.0, 2.8),
        }
        records.append(rec)
        labels.append(random.choice(["Average", "At Risk"]))

    # ═══════════════════════════════════════════════════════════════════════
    # SEGMENT 6 — Contradictory real-world patterns (8 %)
    # High attendance but poor marks  → Average (not Good)
    # Good marks but very low attendance → Average or At Risk
    # Studies hard but performs poorly   → Average
    # ═══════════════════════════════════════════════════════════════════════
    n6 = int(n_samples * 0.08)
    for _ in range(n6):
        profile = random.choice(["att_high_marks_low", "marks_high_att_low", "study_high_perform_low"])
        if profile == "att_high_marks_low":
            rec = {
                "attendance_percentage": _clip(np.random.normal(82, 6),   72, 95),
                "internal_marks":        _clip(np.random.normal(42, 7),   30, 55),
                "assignment_score":      _clip(np.random.normal(40, 7),   28, 54),
                "study_hours_per_day":   _clip(np.random.normal(2.0, 0.8), 0.5, 3.5),
            }
            labels.append("Average")   # good attendance doesn't save poor marks
        elif profile == "marks_high_att_low":
            rec = {
                "attendance_percentage": _clip(np.random.normal(42, 8),   25, 58),
                "internal_marks":        _clip(np.random.normal(68, 7),   55, 82),
                "assignment_score":      _clip(np.random.normal(65, 7),   52, 80),
                "study_hours_per_day":   _clip(np.random.normal(4.0, 1.0), 2.0, 7.0),
            }
            labels.append(random.choice(["Average", "At Risk"]))  # risk from absences
        else:  # study_high_perform_low
            rec = {
                "attendance_percentage": _clip(np.random.normal(68, 6),   57, 80),
                "internal_marks":        _clip(np.random.normal(42, 7),   30, 54),
                "assignment_score":      _clip(np.random.normal(45, 7),   32, 58),
                "study_hours_per_day":   _clip(np.random.normal(5.5, 1.0), 3.5, 9.0),
            }
            labels.append("Average")   # studies hard but not effective
        records.append(rec)

    # ═══════════════════════════════════════════════════════════════════════
    # SEGMENT 7 — Remaining filler (mixed average) to reach n_samples
    # ═══════════════════════════════════════════════════════════════════════
    n7 = n_samples - n1 - n2 - n3 - n4 - n5 - n6
    for _ in range(n7):
        rec = {
            "attendance_percentage": _clip(np.random.normal(65, 12),  20, 100),
            "internal_marks":        _clip(np.random.normal(55, 15),  5,  100),
            "assignment_score":      _clip(np.random.normal(53, 14),  5,  100),
            "study_hours_per_day":   _clip(np.random.normal(3.0, 1.8), 0,  10),
        }
        records.append(rec)
        # Label by soft rules with wide overlap
        att = rec["attendance_percentage"]
        mrk = rec["internal_marks"]
        asg = rec["assignment_score"]
        hrs = rec["study_hours_per_day"]
        score = (att / 100) * 0.35 + (mrk / 100) * 0.30 + (asg / 100) * 0.25 + (hrs / 10) * 0.10
        if score >= 0.68:
            labels.append("Good")
        elif score <= 0.44:
            labels.append("At Risk")
        else:
            labels.append("Average")

    # ── Shuffle ──────────────────────────────────────────────────────────────
    combined = list(zip(records, labels))
    random.shuffle(combined)
    records, labels = zip(*combined)
    records = list(records)
    labels  = list(labels)

    # ── Apply label noise (~8%) to simulate real-world grading inconsistency ─
    all_classes = ["Good", "Average", "At Risk"]
    noise_count = 0
    for i in range(len(labels)):
        if random.random() < LABEL_NOISE_RATE:
            current = labels[i]
            others  = [c for c in all_classes if c != current]
            # Bias: mostly flip to adjacent class, rarely jump across
            if current == "Good":
                labels[i] = random.choices(["Average", "At Risk"], weights=[0.85, 0.15])[0]
            elif current == "At Risk":
                labels[i] = random.choices(["Average", "Good"], weights=[0.85, 0.15])[0]
            else:  # Average
                labels[i] = random.choice(["Good", "At Risk"])
            noise_count += 1

    # ── Build DataFrame ───────────────────────────────────────────────────────
    df = pd.DataFrame(records)
    df["performance_label"] = labels

    # Add identity columns (NOT used in ML training)
    df.insert(0, "student_id",   [_generate_student_id(i + 1) for i in range(len(df))])
    df.insert(1, "student_name", [_generate_name() for _ in range(len(df))])

    if save:
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        df.to_csv(DATASET_PATH, index=False)
        dist = df["performance_label"].value_counts()
        print(f"[Dataset] Saved {len(df)} rows -> {DATASET_PATH}")
        print(f"[Dataset] Label noise applied to ~{noise_count} rows ({noise_count/len(df)*100:.1f}%)")
        print(f"[Dataset] Label distribution:")
        for lbl, cnt in dist.items():
            print(f"  {lbl:10s}: {cnt:5d}  ({cnt/len(df)*100:.1f}%)")

    return df


if __name__ == "__main__":
    df = generate_dataset()
    print(df.head())
