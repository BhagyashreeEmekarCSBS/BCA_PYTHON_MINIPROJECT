# predictor.py
# This class builds the classification model and predicts diabetes.

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report


class DiabetesPredictor:

    def __init__(self, data):
        self.data = data
        self.scaler = StandardScaler()
        self.model = LogisticRegression()
        self.accuracy = 0

    def train_model(self):
        print("\n----- CLASSIFICATION MODEL -----")

        self.X = self.data.drop("Outcome", axis=1)
        y = self.data["Outcome"]

        # 80% training and 20% testing
        X_train, self.X_test, y_train, self.y_test = train_test_split(
            self.X, y, test_size=0.2, random_state=42
        )

        # Scale the data
        X_train = self.scaler.fit_transform(X_train)
        self.X_test = self.scaler.transform(self.X_test)

        # Train the model
        self.model.fit(X_train, y_train)
        print("Model trained successfully.")

    def evaluate_model(self):
        print("\n----- MODEL EVALUATION -----")

        y_pred = self.model.predict(self.X_test)

        self.accuracy = accuracy_score(self.y_test, y_pred)
        print("Accuracy of the model:", round(self.accuracy * 100, 2), "%")

        cm = confusion_matrix(self.y_test, y_pred)
        print("\nConfusion Matrix:")
        print(cm)

        print("\nClassification Report:")
        print(classification_report(self.y_test, y_pred))

        # Plot confusion matrix
        plt.figure(figsize=(5, 4))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
        plt.title("Confusion Matrix")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.show()

        # Important features
        importance = pd.Series(self.model.coef_[0], index=self.X.columns)
        importance = importance.sort_values(ascending=False)
        print("\nImportant health indicators (model coefficients):")
        print(importance)

        plt.figure(figsize=(8, 5))
        importance.plot(kind="bar")
        plt.title("Important Features for Diabetes Prediction")
        plt.ylabel("Coefficient")
        plt.show()

    def predict_patient(self, values):
        # values order: Pregnancies, Glucose, BloodPressure, SkinThickness,
        #               Insulin, BMI, DiabetesPedigreeFunction, Age
        patient = pd.DataFrame([values], columns=self.X.columns)
        patient = self.scaler.transform(patient)
        result = self.model.predict(patient)[0]
        probability = self.model.predict_proba(patient)[0][1] * 100
        return result, probability
