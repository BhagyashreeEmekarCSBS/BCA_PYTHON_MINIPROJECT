"""
Example: score new customers using the saved pipeline.

Create `new_customers.csv` with the same predictor columns used during training.
Do not include the target column. Then run:
    python predict_new_customers.py
"""
from pathlib import Path
import joblib
import pandas as pd

model_path = Path("models/churn_pipeline.joblib")
input_path = Path("new_customers.csv")
output_path = Path("outputs/new_customer_churn_scores.csv")

if not model_path.exists():
    raise FileNotFoundError("Run churn_project.py successfully first.")
if not input_path.exists():
    raise FileNotFoundError("Create new_customers.csv using the same feature columns as training.")

model = joblib.load(model_path)
customers = pd.read_csv(input_path)

probabilities = model.predict_proba(customers)[:, 1]
predictions = (probabilities >= 0.5).astype(int)

result = customers.copy()
result["ChurnProbability"] = probabilities
result["PredictedChurn"] = predictions
result["RiskLevel"] = pd.cut(
    probabilities,
    bins=[-0.001, 0.30, 0.60, 1.0],
    labels=["Low", "Medium", "High"]
)
output_path.parent.mkdir(exist_ok=True)
result.to_csv(output_path, index=False)
print(result[["ChurnProbability", "PredictedChurn", "RiskLevel"]].head(20))
print(f"Saved scores to {output_path}")
