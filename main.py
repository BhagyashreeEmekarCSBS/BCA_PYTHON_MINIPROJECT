"""
Student Learning Behaviour Analysis System
Compatible with Python 3.11.9 on Windows.

Run:
    py -m pip install -r requirements.txt
    py main.py
"""

from pathlib import Path
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore", category=FutureWarning)

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "student_performance.csv"
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

NUMERIC_FEATURES = [
    "study_hours_per_day",
    "attendance_percent",
    "previous_marks",
    "assignment_score",
    "final_marks",
]


def load_data():
    """Load and validate the student dataset."""
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}\n"
            "Keep student_performance.csv in the same folder as main.py."
        )
    data = pd.read_csv(DATA_FILE)
    required = ["student_id"] + NUMERIC_FEATURES + [
        "parent_education_level", "internet_access"
    ]
    missing = [column for column in required if column not in data.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    for column in NUMERIC_FEATURES:
        data[column] = pd.to_numeric(data[column], errors="coerce")
    data = data.dropna(subset=NUMERIC_FEATURES).copy()
    if len(data) < 3:
        raise ValueError("At least three valid student records are required.")
    return data


def perform_eda(data):
    """Print basic exploratory data analysis and save visualizations."""
    print("\n" + "=" * 64)
    print("STUDENT LEARNING BEHAVIOUR ANALYSIS")
    print("=" * 64)
    print(f"\nNumber of student records: {len(data)}")
    print("\nFirst five records:")
    print(data.head().to_string(index=False))
    print("\nDescriptive statistics:")
    print(data[NUMERIC_FEATURES].describe().round(2).to_string())
    print("\nMissing values per column:")
    print(data.isna().sum().to_string())

    sns.set_theme(style="whitegrid")

    plt.figure(figsize=(8, 5))
    sns.histplot(data["final_marks"], bins=8, kde=True)
    plt.title("Distribution of Final Marks")
    plt.xlabel("Final marks")
    plt.ylabel("Number of students")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "final_marks_distribution.png", dpi=150)
    plt.close()

    correlation = data[NUMERIC_FEATURES].corr(numeric_only=True)
    plt.figure(figsize=(8, 6))
    sns.heatmap(correlation, annot=True, cmap="coolwarm", vmin=-1, vmax=1, fmt=".2f")
    plt.title("Correlation Between Study Habits and Academic Performance")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "correlation_heatmap.png", dpi=150)
    plt.close()
    correlation.to_csv(OUTPUT_DIR / "correlation_matrix.csv")

    plt.figure(figsize=(8, 5))
    sns.scatterplot(
        data=data, x="study_hours_per_day", y="final_marks",
        hue="attendance_percent", palette="viridis", s=90
    )
    plt.title("Study Hours vs Final Marks")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "study_hours_vs_marks.png", dpi=150)
    plt.close()

    return correlation


def create_clusters(data):
    """Scale selected features and group students using K-Means."""
    features = [
        "study_hours_per_day",
        "attendance_percent",
        "previous_marks",
        "assignment_score",
        "final_marks",
    ]
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(data[features])

    # Four clusters are used to provide interpretable example profiles.
    model = KMeans(n_clusters=4, random_state=42, n_init=10)
    result = data.copy()
    result["cluster"] = model.fit_predict(scaled_features) + 1
    result.to_csv(OUTPUT_DIR / "student_cluster_results.csv", index=False)

    profile = result.groupby("cluster")[features].mean().round(2)
    profile["number_of_students"] = result.groupby("cluster").size()
    profile.to_csv(OUTPUT_DIR / "cluster_profiles.csv")

    plt.figure(figsize=(9, 5))
    sns.scatterplot(
        data=result, x="study_hours_per_day", y="final_marks",
        hue="cluster", palette="Set2", s=100
    )
    plt.title("Student Learning Behaviour Clusters")
    plt.xlabel("Study hours per day")
    plt.ylabel("Final marks")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "student_clusters.png", dpi=150)
    plt.close()
    return result, profile


def profile_and_recommend(row):
    """Create simple, understandable suggestions from student indicators."""
    suggestions = []
    if row["attendance_percent"] < 70:
        suggestions.append("Improve attendance and discuss missed classes with a teacher.")
    if row["study_hours_per_day"] < 2:
        suggestions.append("Start with a consistent daily study routine of short sessions.")
    if row["assignment_score"] < 60:
        suggestions.append("Practise assignment questions and ask for feedback.")
    if row["previous_marks"] < 60 or row["final_marks"] < 60:
        suggestions.append("Revise foundational topics and take regular low-stakes practice tests.")
    if row["study_hours_per_day"] >= 4 and row["final_marks"] < 70:
        suggestions.append("Review study methods; use active recall, worked examples, and spaced revision.")
    if row["final_marks"] >= 80 and row["attendance_percent"] >= 80:
        suggestions.append("Maintain the current habits and try enrichment or peer-learning activities.")
    if not suggestions:
        suggestions.append("Maintain a balanced routine and monitor progress every few weeks.")
    return " ".join(dict.fromkeys(suggestions))


def create_recommendations(clustered_data):
    """Generate per-student recommendations and a cluster summary."""
    output = clustered_data.copy()
    output["learning_recommendation"] = output.apply(profile_and_recommend, axis=1)
    output.to_csv(OUTPUT_DIR / "student_recommendations.csv", index=False)

    print("\nCluster summaries and recommendations:")
    for cluster_id in sorted(output["cluster"].unique()):
        group = output[output["cluster"] == cluster_id]
        avg_marks = group["final_marks"].mean()
        avg_hours = group["study_hours_per_day"].mean()
        avg_attendance = group["attendance_percent"].mean()

        if avg_marks >= 80:
            profile = "Higher-performing / consistent group"
            advice = "Maintain effective routines and use enrichment activities."
        elif avg_marks >= 60:
            profile = "Developing / moderate-performing group"
            advice = "Use weekly revision, assignment feedback, and practice tests."
        else:
            profile = "Needs additional academic support"
            advice = "Offer foundational revision, teacher check-ins, and a manageable study plan."

        print(f"\nCluster {cluster_id}: {profile}")
        print(f"  Students: {len(group)}")
        print(f"  Average final marks: {avg_marks:.1f}")
        print(f"  Average study hours/day: {avg_hours:.1f}")
        print(f"  Average attendance: {avg_attendance:.1f}%")
        print(f"  Suggested action: {advice}")

    print("\nIndividual student recommendations (first 10):")
    print(output[["student_id", "cluster", "final_marks", "learning_recommendation"]]
          .head(10).to_string(index=False))


def main():
    try:
        data = load_data()
        correlation = perform_eda(data)
        print("\nCorrelation with final marks:")
        print(correlation["final_marks"].sort_values(ascending=False).round(2).to_string())

        clustered_data, cluster_profile = create_clusters(data)
        create_recommendations(clustered_data)

        print("\n" + "=" * 64)
        print("PROJECT COMPLETED SUCCESSFULLY")
        print(f"Output files are saved in:\n{OUTPUT_DIR}")
        print("\nGenerated files:")
        for path in sorted(OUTPUT_DIR.iterdir()):
            print(f" - {path.name}")
        print("\nNote: This included dataset is synthetic sample data for demonstration.")
        print("Replace it with an approved real dataset for a real-world study.")
        print("Correlations show associations, not proof of cause and effect.")
        print("=" * 64)
    except Exception as error:
        print("\nThe project could not finish.")
        print(f"Reason: {error}")
        print("\nCheck that the dataset is beside main.py and dependencies are installed.")
        raise


if __name__ == "__main__":
    main()
