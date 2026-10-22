# Credit Risk Assessment Using Feature Selection & Reduction

## Project Overview
This project analyses loan applicant data and predicts whether an application is approved or rejected. It demonstrates exploratory data analysis (EDA), Random Forest feature importance, Principal Component Analysis (PCA), and classification performance evaluation.

**Important:** The dataset target is loan approval status. It does not directly represent whether a borrower will default on a loan.

## Objectives
- Explore loan applicant data using visualisations.
- Identify influential input features using Random Forest feature importance.
- Reduce dimensionality using PCA while retaining at least 95% of training-set variance.
- Compare models using all features, selected features, and PCA-transformed features.
- Evaluate accuracy, precision, recall, F1-score, and confusion matrices.

## Project Structure
```text
Credit_Risk_Assessment_Submission/
├── README.md
├── requirements.txt
├── .gitignore
├── data/
│   └── loan_approval_dataset.csv
├── src/
│   └── main.py
└── results/
    ├── EDA graphs
    ├── feature_importance.csv
    ├── model_performance_comparison.csv
    ├── detailed_classification_report.txt
    ├── project_summary.txt
    └── confusion matrix and PCA graphs
```

## Dataset
The included CSV is the dataset used for this project. Before publishing this repository, add the original dataset source URL and confirm that its licence permits redistribution.

## Requirements
- Python 3.9 or later
- pandas
- NumPy
- Matplotlib
- Seaborn
- scikit-learn

## Run Locally
1. Download or clone this repository.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the analysis:

   ```bash
   python src/main.py
   ```

The script reads `data/loan_approval_dataset.csv` and writes graphs, model metrics, confusion matrices, and a summary into the `results/` folder.

## Methodology
1. Clean column names and trim text values.
2. Visualise loan status, applicant income, CIBIL scores, and numeric correlations.
3. Split the data into training and test sets using an 80/20 split and a fixed random seed.
4. Train a Random Forest classifier using all encoded features.
5. Rank features using training-set Random Forest feature importance and train another classifier on the top 10 features.
6. Standardise features using training data and apply PCA to retain at least 95% explained variance.
7. Compare the three approaches using the same held-out test set.

## Evaluation
The generated `results/model_performance_comparison.csv` contains accuracy, precision, recall, F1-score, and feature counts. Confusion matrices and detailed classification reports are also saved.

## Limitations
- Results depend on the dataset and the selected train/test split.
- Feature importance indicates predictive usefulness in this model; it does not prove causation.
- Approval prediction should not be treated as a real-world lending decision system without validation, fairness testing, data governance, and domain review.
- The results are educational and are not financial advice.

## Reproducibility
A fixed random seed (`42`) is used for splitting data and training Random Forest models.
