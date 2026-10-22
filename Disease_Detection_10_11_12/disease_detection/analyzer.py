# analyzer.py
# This class does the EDA (Exploratory Data Analysis) and correlation analysis.

import matplotlib.pyplot as plt
import seaborn as sns


class DataAnalyzer:

    def __init__(self, data):
        self.data = data

    def show_eda(self):
        print("\n----- EXPLORATORY DATA ANALYSIS -----")

        # How many patients have diabetes?
        print("\nNumber of diabetic (1) and non-diabetic (0) patients:")
        print(self.data["Outcome"].value_counts())

        # Count plot
        plt.figure(figsize=(5, 4))
        sns.countplot(x="Outcome", data=self.data)
        plt.title("Diabetic vs Non-Diabetic Patients")
        plt.xlabel("Outcome (0 = No Diabetes, 1 = Diabetes)")
        plt.ylabel("Number of Patients")
        plt.show()

        # Histograms of all columns
        self.data.hist(figsize=(12, 10))
        plt.suptitle("Distribution of Health Attributes")
        plt.show()

        # Boxplot of Glucose
        plt.figure(figsize=(5, 4))
        sns.boxplot(x="Outcome", y="Glucose", data=self.data)
        plt.title("Glucose Level vs Outcome")
        plt.show()

        # Average values for each group
        print("\nAverage values for each group:")
        print(self.data.groupby("Outcome").mean())

    def show_correlation(self):
        print("\n----- CORRELATION ANALYSIS -----")
        corr = self.data.corr()

        plt.figure(figsize=(10, 7))
        sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f")
        plt.title("Correlation Heatmap")
        plt.show()

        print("\nCorrelation of each feature with Outcome (highest first):")
        print(corr["Outcome"].sort_values(ascending=False))
