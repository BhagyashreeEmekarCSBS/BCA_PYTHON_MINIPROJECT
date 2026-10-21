# E-Commerce Customer Churn Prediction

A Python machine-learning mini project that analyzes customer behaviour and predicts churn.

## Dataset
This project expects a CSV file named `ecommerce_customers.csv` in the project folder.
The target column should be named `Churn` (or `churn`) and contain values such as:
- 1 / 0
- Yes / No
- True / False
- Churned / Retained

Example features supported by the code include:
`Tenure`, `PreferredLoginDevice`, `CityTier`, `WarehouseToHome`,
`PreferredPaymentMode`, `Gender`, `HourSpendOnApp`, `NumberOfDeviceRegistered`,
`PreferedOrderCat`, `SatisfactionScore`, `MaritalStatus`,
`NumberOfAddress`, `Complain`, `OrderAmountHikeFromlastYear`,
`CouponUsed`, `OrderCount`, `DaySinceLastOrder`, `CashbackAmount`.

These names match common e-commerce churn datasets, but your actual file may differ.
The script prints the available columns and validates the target. Edit `TARGET_COLUMN`
if your target has a different name.

## Run
1. Install Python 3.10+.
2. Put your dataset CSV in this folder and name it `ecommerce_customers.csv`.
3. Open a terminal in this folder:
   `pip install -r requirements.txt`
4. Run:
   `python churn_project.py`

The script creates charts in `outputs/`, saves evaluation reports, and stores the fitted model
and preprocessing pipeline in `models/`.

## Important
- Do not use a customer ID as a predictive feature.
- Only use features that would be available at the time you want to make a prediction.
- The model results are not known until the script is run on your actual dataset.
- Accuracy alone can be misleading when churn is uncommon; review recall, F1, ROC-AUC and the confusion matrix.
