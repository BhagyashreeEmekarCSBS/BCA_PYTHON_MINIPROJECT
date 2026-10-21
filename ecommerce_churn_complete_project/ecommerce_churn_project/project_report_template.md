# Mini Project 6: E-Commerce Customer Churn Prediction

## 1. Abstract
This project develops a supervised machine-learning system to estimate whether an e-commerce customer is likely to churn. Customer behaviour features are cleaned and analyzed, and classification models are compared using a held-out test set. The system also reports feature importance and provides retention recommendations. Replace this template's placeholders with actual values from your run.

## 2. Problem Statement
Customer churn can reduce revenue and increase the cost of acquiring replacement customers. The project aims to use historical customer behaviour to identify customers who may stop purchasing so that a business can investigate and offer appropriate retention support.

## 3. Objectives
- Analyze customer transaction and behaviour data.
- Perform data cleaning and exploratory data analysis.
- Identify features associated with churn.
- Train and compare classification models.
- Evaluate predictions using accuracy, precision, recall, F1-score, ROC-AUC and a confusion matrix.
- Suggest practical retention strategies.

## 4. Tools and Technologies
Python, Pandas, NumPy, Matplotlib, Seaborn, Scikit-learn and Joblib.

## 5. Dataset Description
Dataset source: [insert dataset name, publisher and URL].
Number of rows: [fill after running].
Number of predictor columns: [fill after running].
Target column: `Churn`.
Label definition: [explain how churn is defined and over what period].
Feature descriptions: [describe the fields in your CSV].

## 6. Methodology
1. Load the CSV and inspect shape, columns, data types, missing values and duplicates.
2. Remove duplicate rows and rows without a target label.
3. Convert target values to binary labels: churn = 1 and retained = 0.
4. Explore churn distribution and numeric/categorical patterns.
5. Split data into training and test sets using stratification.
6. Impute missing numeric values with the median and categorical values with the most frequent value.
7. Scale numeric inputs and one-hot encode categorical inputs.
8. Train Logistic Regression and Random Forest models.
9. Compare model metrics and inspect confusion matrices and ROC curve.
10. Calculate permutation importance to identify useful predictive features.

## 7. Results
Fill this table using `outputs/model_comparison.csv`.

| Model | Accuracy | Precision | Recall | F1-score | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | [fill] | [fill] | [fill] | [fill] | [fill] |
| Random Forest | [fill] | [fill] | [fill] | [fill] | [fill] |

Best model by ROC-AUC: [fill].
Confusion matrix findings: [explain true positives, true negatives, false positives and false negatives].
Top predictive features: [use outputs/feature_importance.csv].

## 8. Interpretation
Accuracy is the proportion of all predictions that are correct. Precision indicates how many customers predicted to churn actually churned. Recall indicates how many actual churners were identified. F1-score balances precision and recall. ROC-AUC measures ranking ability across classification thresholds. Select a model based on business costs, especially the cost of missing a likely churner versus contacting a retained customer.

Feature importance indicates predictive association, not proof that a feature causes churn.

## 9. Retention Recommendations
Use the actual model findings to choose appropriate actions:
- If recency is important, test a timely and relevant re-engagement message.
- If complaints or satisfaction are important, prioritize service recovery and follow up on unresolved issues.
- If order frequency is important, test replenishment reminders, loyalty benefits or personalized recommendations.
- If discounts are relevant, test targeted offers with a profitability limit rather than giving discounts to every customer.
Measure results with controlled experiments where feasible.

## 10. Limitations
- Performance depends on the dataset's size, quality and representativeness.
- Churn labels must have a clear business definition and observation window.
- Historical associations do not prove causation.
- Random splits may be optimistic if the intended use is future prediction; a time-based test is preferable when dates are available.
- The model requires monitoring and retraining as customer behaviour changes.

## 11. Conclusion
Summarize the actual test results, the most useful predictive features, and how the system could support customer retention. Do not invent results; insert metrics from your run.

## 12. Future Scope
- Use a time-based validation split.
- Tune hyperparameters and calibrate probabilities.
- Add transaction history and time-window features.
- Build a simple Streamlit dashboard.
- Test retention campaigns and measure incremental impact.
