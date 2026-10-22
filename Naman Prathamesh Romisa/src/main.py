from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, ConfusionMatrixDisplay, classification_report
)

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "loan_approval_dataset.csv"
OUT = ROOT / "results"
OUT.mkdir(parents=True, exist_ok=True)

# Load and clean data
df = pd.read_csv(DATA)
df.columns = df.columns.str.strip()

for col in df.select_dtypes(include="object").columns:
    df[col] = df[col].str.strip()

required = {"loan_status", "loan_id"}
if not required.issubset(df.columns):
    raise ValueError("Dataset must contain loan_status and loan_id columns.")

df = df.dropna(subset=["loan_status"]).copy()

# Exploratory data analysis
sns.set_theme(style="whitegrid")

plt.figure(figsize=(7, 5))
sns.countplot(data=df, x="loan_status", hue="loan_status",
              legend=False, palette="Set2")
plt.title("Loan Approval Status Distribution")
plt.tight_layout()
plt.savefig(OUT / "01_loan_status_distribution.png", dpi=300)
plt.close()

plt.figure(figsize=(7, 5))
sns.boxplot(data=df, x="loan_status", y="income_annum",
            hue="loan_status", legend=False, palette="Set3")
plt.title("Annual Income vs Loan Status")
plt.tight_layout()
plt.savefig(OUT / "02_income_vs_loan_status.png", dpi=300)
plt.close()

plt.figure(figsize=(7, 5))
sns.boxplot(data=df, x="loan_status", y="cibil_score",
            hue="loan_status", legend=False, palette="pastel")
plt.title("CIBIL Score vs Loan Status")
plt.tight_layout()
plt.savefig(OUT / "03_cibil_vs_loan_status.png", dpi=300)
plt.close()

numeric = df.select_dtypes(include="number").drop(
    columns=["loan_id"], errors="ignore"
)
plt.figure(figsize=(11, 7))
sns.heatmap(numeric.corr(), annot=True, cmap="coolwarm", fmt=".2f")
plt.title("Feature Correlation Heatmap")
plt.tight_layout()
plt.savefig(OUT / "04_correlation_heatmap.png", dpi=300)
plt.close()

# Prepare features and target
X = df.drop(columns=["loan_status", "loan_id"])
y = LabelEncoder().fit_transform(df["loan_status"])

X = pd.get_dummies(X, drop_first=True)
X = X.replace([np.inf, -np.inf], np.nan)
X = X.fillna(X.median(numeric_only=True)).fillna(0)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Model 1: all features
model_all = RandomForestClassifier(n_estimators=100, random_state=42)
model_all.fit(X_train, y_train)
pred_all = model_all.predict(X_test)

# Feature selection using training data only
importance = pd.DataFrame({
    "Feature": X_train.columns,
    "Importance": model_all.feature_importances_
}).sort_values("Importance", ascending=False)

importance.to_csv(OUT / "feature_importance.csv", index=False)

plt.figure(figsize=(9, 6))
sns.barplot(data=importance.head(10), x="Importance", y="Feature",
            hue="Feature", legend=False, palette="viridis")
plt.title("Top 10 Important Features")
plt.tight_layout()
plt.savefig(OUT / "05_feature_importance.png", dpi=300)
plt.close()

top_features = importance.head(min(10, len(importance)))["Feature"].tolist()
model_selected = RandomForestClassifier(n_estimators=100, random_state=42)
model_selected.fit(X_train[top_features], y_train)
pred_selected = model_selected.predict(X_test[top_features])

# PCA: standardize using training data, retain at least 95% variance
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

pca_check = PCA().fit(X_train_scaled)
cumulative = np.cumsum(pca_check.explained_variance_ratio_)
n_components = int(np.argmax(cumulative >= 0.95) + 1)

pca = PCA(n_components=n_components)
X_train_pca = pca.fit_transform(X_train_scaled)
X_test_pca = pca.transform(X_test_scaled)

plt.figure(figsize=(8, 5))
plt.plot(range(1, len(cumulative) + 1), cumulative * 100, marker="o")
plt.axhline(95, linestyle="--", color="red", label="95% target")
plt.xlabel("Number of Components")
plt.ylabel("Cumulative Explained Variance (%)")
plt.title("PCA Explained Variance")
plt.legend()
plt.tight_layout()
plt.savefig(OUT / "06_pca_explained_variance.png", dpi=300)
plt.close()

model_pca = RandomForestClassifier(n_estimators=100, random_state=42)
model_pca.fit(X_train_pca, y_train)
pred_pca = model_pca.predict(X_test_pca)

# Compare all approaches
model_predictions = [
    ("All Features", pred_all),
    ("Selected Features", pred_selected),
    ("PCA Features", pred_pca)
]

results = []
for name, pred in model_predictions:
    results.append({
        "Method": name,
        "Number of Features": (
            X_train.shape[1] if name == "All Features"
            else len(top_features) if name == "Selected Features"
            else n_components
        ),
        "Accuracy (%)": round(accuracy_score(y_test, pred) * 100, 2),
        "Precision (%)": round(precision_score(y_test, pred, zero_division=0) * 100, 2),
        "Recall (%)": round(recall_score(y_test, pred, zero_division=0) * 100, 2),
        "F1-Score (%)": round(f1_score(y_test, pred, zero_division=0) * 100, 2)
    })

report = pd.DataFrame(results)
report.to_csv(OUT / "model_performance_comparison.csv", index=False)

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
for ax, (name, pred) in zip(axes, model_predictions):
    ConfusionMatrixDisplay(
        confusion_matrix=confusion_matrix(y_test, pred)
    ).plot(ax=ax, cmap="Blues", colorbar=False)
    ax.set_title(name)
plt.suptitle("Confusion Matrix Comparison")
plt.tight_layout()
plt.savefig(OUT / "07_confusion_matrices.png", dpi=300)
plt.close()

with open(OUT / "detailed_classification_report.txt", "w", encoding="utf-8") as f:
    for name, pred in model_predictions:
        f.write(f"\n{name}\n")
        f.write(classification_report(y_test, pred, zero_division=0))
        f.write("\n")

best = report.loc[report["Accuracy (%)"].idxmax()]

with open(OUT / "project_summary.txt", "w", encoding="utf-8") as f:
    f.write("CREDIT RISK ASSESSMENT USING FEATURE SELECTION & REDUCTION\n\n")
    f.write(f"Dataset records: {len(df)}\n")
    f.write(f"Original predictor features: {X_train.shape[1]}\n")
    f.write(f"Selected features: {len(top_features)}\n")
    f.write(f"PCA components retaining at least 95% variance: {n_components}\n\n")
    f.write("Model comparison:\n")
    f.write(report.to_string(index=False))
    f.write("\n\nBest test accuracy in this comparison:\n")
    f.write(best.to_string())
    f.write("\n\nNote: This dataset predicts loan approval/rejection, not actual future loan default.\n")

print("Analysis completed.")
print(report.to_string(index=False))
print(f"\nResults saved in: {OUT}")
