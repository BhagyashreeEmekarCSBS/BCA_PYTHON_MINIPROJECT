"""
OPTIONAL teaching/demo data generator.
This creates synthetic data only, to test that the code runs.
Do NOT present its metrics as real-world evidence. Replace the generated CSV
with your actual course dataset for the final project.
"""
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n = 1200
tenure = rng.integers(1, 61, n)
orders = rng.poisson(5, n)
days_since = rng.integers(0, 91, n)
complain = rng.binomial(1, 0.18, n)
satisfaction = rng.integers(1, 6, n)
hour_spend = np.clip(rng.normal(2.5, 1.0, n), 0, 8)
cashback = np.clip(rng.normal(180, 70, n), 0, None)
city_tier = rng.choice([1, 2, 3], n, p=[0.45, 0.30, 0.25])
device = rng.choice(["Mobile Phone", "Computer"], n, p=[0.75, 0.25])
payment = rng.choice(["Debit Card", "Credit Card", "UPI", "Cash on Delivery"], n)

# Synthetic relationship included for demonstration only.
logit = -1.3 - 0.035 * tenure - 0.16 * orders + 0.027 * days_since + 0.95 * complain \
        - 0.28 * satisfaction - 0.07 * hour_spend
prob = 1 / (1 + np.exp(-logit))
churn = rng.binomial(1, prob)

df = pd.DataFrame({
    "CustomerID": [f"C{i:05d}" for i in range(n)],
    "Tenure": tenure,
    "OrderCount": orders,
    "DaySinceLastOrder": days_since,
    "Complain": complain,
    "SatisfactionScore": satisfaction,
    "HourSpendOnApp": hour_spend.round(2),
    "CashbackAmount": cashback.round(2),
    "CityTier": city_tier,
    "PreferredLoginDevice": device,
    "PreferredPaymentMode": payment,
    "Churn": churn
})
# Add a small amount of missingness for preprocessing demonstration.
for col in ["SatisfactionScore", "CashbackAmount", "PreferredPaymentMode"]:
    idx = rng.choice(df.index, size=12, replace=False)
    df.loc[idx, col] = np.nan

df.to_csv("ecommerce_customers.csv", index=False)
print("Created synthetic ecommerce_customers.csv for demonstration only.")
print(df.head())
