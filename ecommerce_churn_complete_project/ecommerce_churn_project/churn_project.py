"""
Mini Project 6: E-Commerce Customer Churn Prediction
Run: python churn_project.py

This script:
1. Loads and validates a customer dataset
2. Cleans target values and performs basic EDA
3. Splits the data into train/test sets
4. Builds preprocessing + Logistic Regression and Random Forest pipelines
5. Evaluates models and saves the best by ROC-AUC
6. Reports feature importance (permutation importance)
7. Saves a reusable model pipeline
"""

from pathlib import Path
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    RocCurveDisplay
)
from sklearn.inspection import permutation_importance

# ---------- Configuration ----------
DATA_PATH = Path("ecommerce_customers.csv")
TARGET_COLUMN = "Churn"  # Change this if your target column has another name
ID_CANDIDATES = {"customerid", "customer_id", "customer id", "userid", "user_id"}
RANDOM_STATE = 42
TEST_SIZE = 0.20

OUT_DIR = Path("outputs")
MODEL_DIR = Path("models")
OUT_DIR.mkdir(exist_ok=True)
MODEL_DIR.mkdir(exist_ok=True)

sns.set_theme(style="whitegrid")


def normalize_target(series: pd.Series) -> pd.Series:
    """Convert common churn labels to binary 0/1; fail loudly on unknown labels."""
    if pd.api.types.is_numeric_dtype(series):
        values = set(series.dropna().unique().tolist())
        if values.issubset({0, 1}):
            return series.astype("Int64")
    mapping = {
        "1": 1, "0": 0,
        "yes": 1, "no": 0,
        "true": 1, "false": 0,
        "churn": 1, "churned": 1,
        "left": 1, "exited": 1,
        "retained": 0, "stay": 0, "stayed": 0,
        "not churned": 0, "not_churned": 0,
        "active": 0, "loyal": 0
    }
    normalized = series.astype(str).str.strip().str.lower().map(mapping)
    if normalized.isna().any():
        unknown = sorted(series[normalized.isna()].dropna().astype(str).unique())
        raise ValueError(
            f"Cannot map these target labels to churn=1 / retained=0: {unknown}. "
            "Edit normalize_target() for your dataset's labels."
        )
    return normalized.astype("Int64")


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Could not find {DATA_PATH.resolve()}. Put your CSV in this folder "
            "or change DATA_PATH at the top of this script."
        )

    df = pd.read_csv(DATA_PATH)
    print("\\n=== DATASET OVERVIEW ===")
    print("Shape:", df.shape)
    print("\\nColumns:", df.columns.tolist())
    print("\\nFirst five rows:\\n", df.head())
    print("\\nData types and non-null counts:")
    df.info()
    print("\\nMissing values (top 20):\\n", df.isna().sum().sort_values(ascending=False).head(20))
    print("\\nDuplicate rows:", df.duplicated().sum())

    # Remove exact duplicate records and rows with missing target.
    df = df.drop_duplicates().copy()
    target_matches = [c for c in df.columns if c.lower() == TARGET_COLUMN.lower()]
    if not target_matches:
        raise ValueError(
            f"Target column '{TARGET_COLUMN}' not found. Available columns: {df.columns.tolist()}. "
            "Set TARGET_COLUMN to your target column name."
        )
    target = target_matches[0]
    df = df.dropna(subset=[target]).copy()
    y = normalize_target(df[target]).astype(int)
    X = df.drop(columns=[target]).copy()

    # Exclude obvious identifier columns to reduce memorization / leakage.
    id_cols = [c for c in X.columns if c.strip().lower() in ID_CANDIDATES]
    if id_cols:
        print("\\nDropping identifier columns:", id_cols)
        X = X.drop(columns=id_cols)

    # Drop columns that are entirely empty.
    empty_cols = X.columns[X.isna().all()].tolist()
    if empty_cols:
        print("Dropping entirely empty columns:", empty_cols)
        X = X.drop(columns=empty_cols)

    if y.nunique() < 2:
        raise ValueError("The target contains only one class. Both churn and retained examples are needed.")

    print("\\n=== TARGET DISTRIBUTION ===")
    print(y.value_counts().rename(index={0: "Retained (0)", 1: "Churn (1)"}))
    print("Churn rate: {:.2%}".format(y.mean()))

    # ---------- EDA ----------
    plt.figure(figsize=(6, 4))
    counts = y.map({0: "Retained", 1: "Churned"}).value_counts()
    plt.bar(counts.index.astype(str), counts.values)
    plt.title("Customer Churn Distribution")
    plt.xlabel("Customer status")
    plt.ylabel("Number of customers")
    plt.tight_layout()
    plt.savefig(OUT_DIR / "01_churn_distribution.png", dpi=160)
    plt.close()

    numeric_cols = X.select_dtypes(include=np.number).columns.tolist()
    categorical_cols = X.select_dtypes(exclude=np.number).columns.tolist()

    if numeric_cols:
        X[numeric_cols].hist(figsize=(14, 10), bins=25, edgecolor="black")
        plt.suptitle("Numeric Feature Distributions")
        plt.tight_layout()
        plt.savefig(OUT_DIR / "02_numeric_distributions.png", dpi=160)
        plt.close()

        # Correlation chart is descriptive, not proof of causation.
        corr = X[numeric_cols].corr(numeric_only=True)
        if not corr.empty:
            plt.figure(figsize=(max(8, len(numeric_cols) * 0.7), max(6, len(numeric_cols) * 0.55)))
            sns.heatmap(corr, cmap="coolwarm", center=0, annot=False)
            plt.title("Correlation Between Numeric Features")
            plt.tight_layout()
            plt.savefig(OUT_DIR / "03_numeric_correlation.png", dpi=160)
            plt.close()

    # Grouped churn rate charts for a few categorical features with manageable cardinality.
    for col in categorical_cols[:5]:
        if X[col].nunique(dropna=True) <= 12:
            temp = pd.DataFrame({col: X[col].fillna("Missing").astype(str), "Churn": y})
            rates = temp.groupby(col, observed=False)["Churn"].mean().sort_values(ascending=False)
            plt.figure(figsize=(8, 4))
            plt.bar(rates.index.astype(str), rates.values)
            plt.title(f"Churn Rate by {col}")
            plt.xlabel(col)
            plt.ylabel("Churn rate")
            plt.xticks(rotation=35, ha="right")
            plt.tight_layout()
            safe_name = "".join(ch if ch.isalnum() else "_" for ch in col)
            plt.savefig(OUT_DIR / f"churn_rate_{safe_name}.png", dpi=160)
            plt.close()

    # ---------- Train/test split ----------
    # Split before fitting imputers/scalers/encoders to avoid preprocessing leakage.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    # Determine types based on training partition.
    numeric_features = X_train.select_dtypes(include=np.number).columns.tolist()
    categorical_features = X_train.select_dtypes(exclude=np.number).columns.tolist()

    numeric_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    categorical_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore"))
    ])
    preprocess = ColumnTransformer(transformers=[
        ("numeric", numeric_pipeline, numeric_features),
        ("categorical", categorical_pipeline, categorical_features)
    ])

    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=2000, class_weight="balanced", random_state=RANDOM_STATE
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, min_samples_leaf=2, class_weight="balanced",
            random_state=RANDOM_STATE, n_jobs=-1
        )
    }

    fitted = {}
    metrics_rows = []
    print("\\n=== MODEL EVALUATION ===")
    for name, estimator in models.items():
        pipe = Pipeline(steps=[("preprocess", preprocess), ("model", estimator)])
        pipe.fit(X_train, y_train)
        predictions = pipe.predict(X_test)
        probabilities = pipe.predict_proba(X_test)[:, 1]
        scores = {
            "Model": name,
            "Accuracy": accuracy_score(y_test, predictions),
            "Precision": precision_score(y_test, predictions, zero_division=0),
            "Recall": recall_score(y_test, predictions, zero_division=0),
            "F1": f1_score(y_test, predictions, zero_division=0),
            "ROC_AUC": roc_auc_score(y_test, probabilities)
        }
        metrics_rows.append(scores)
        fitted[name] = pipe
        print(f"\\n{name}")
        print(pd.Series(scores).to_string())
        print("\\nClassification report:\\n", classification_report(
            y_test, predictions, target_names=["Retained", "Churned"], zero_division=0
        ))

        cm = confusion_matrix(y_test, predictions, labels=[0, 1])
        plt.figure(figsize=(5, 4))
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Predicted retained", "Predicted churn"],
            yticklabels=["Actual retained", "Actual churn"]
        )
        plt.title(f"Confusion Matrix — {name}")
        plt.tight_layout()
        plt.savefig(OUT_DIR / f"confusion_matrix_{name.lower().replace(' ', '_')}.png", dpi=160)
        plt.close()

    metrics = pd.DataFrame(metrics_rows).sort_values("ROC_AUC", ascending=False)
    metrics.to_csv(OUT_DIR / "model_comparison.csv", index=False)
    print("\\nModel comparison:\\n", metrics.to_string(index=False))

    best_name = metrics.iloc[0]["Model"]
    best_model = fitted[best_name]
    joblib.dump(best_model, MODEL_DIR / "churn_pipeline.joblib")
    print(f"\\nSaved best model by ROC-AUC: {best_name} -> models/churn_pipeline.joblib")

    # ROC curve for best model.
    plt.figure(figsize=(6, 5))
    RocCurveDisplay.from_estimator(best_model, X_test, y_test)
    plt.title(f"ROC Curve — {best_name}")
    plt.tight_layout()
    plt.savefig(OUT_DIR / "roc_curve_best_model.png", dpi=160)
    plt.close()

    # Permutation importance works with the entire pipeline and original columns.
    print("\\nCalculating permutation importance (may take a little time)...")
    perm = permutation_importance(
        best_model, X_test, y_test, n_repeats=5, random_state=RANDOM_STATE,
        scoring="roc_auc", n_jobs=-1
    )
    importance = pd.DataFrame({
        "Feature": X_test.columns,
        "ImportanceMean": perm.importances_mean,
        "ImportanceStd": perm.importances_std
    }).sort_values("ImportanceMean", ascending=False)
    importance.to_csv(OUT_DIR / "feature_importance.csv", index=False)
    print("\\nTop 15 permutation-importance features:\\n", importance.head(15).to_string(index=False))

    top = importance.head(15).sort_values("ImportanceMean")
    plt.figure(figsize=(9, 6))
    plt.barh(top["Feature"], top["ImportanceMean"], xerr=top["ImportanceStd"])
    plt.title("Top Feature Importance (Permutation, ROC-AUC)")
    plt.xlabel("Decrease in ROC-AUC when feature is shuffled")
    plt.tight_layout()
    plt.savefig(OUT_DIR / "04_feature_importance.png", dpi=160)
    plt.close()

    # Save test-set predictions for transparent review.
    prediction_output = X_test.copy()
    prediction_output["ActualChurn"] = y_test.values
    prediction_output["PredictedChurn"] = best_model.predict(X_test)
    prediction_output["ChurnProbability"] = best_model.predict_proba(X_test)[:, 1]
    prediction_output.to_csv(OUT_DIR / "test_predictions.csv", index=False)

    print("\\n=== OUTPUTS CREATED ===")
    print("- outputs/01_churn_distribution.png")
    print("- outputs/02_numeric_distributions.png (if numeric features exist)")
    print("- outputs/03_numeric_correlation.png (if numeric features exist)")
    print("- outputs/model_comparison.csv")
    print("- outputs/feature_importance.csv")
    print("- outputs/test_predictions.csv")
    print("- outputs/roc_curve_best_model.png")
    print("- outputs/confusion_matrix_*.png")
    print("- models/churn_pipeline.joblib")
    print("\\nInterpret feature importance as predictive association, not causation.")
    print("Before deployment, check data quality, time-based leakage, calibration, and fairness.")


if __name__ == "__main__":
    main()
