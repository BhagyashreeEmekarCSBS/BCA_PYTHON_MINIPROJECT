# data_handler.py
# This class loads the dataset and cleans it.

import pandas as pd
import numpy as np


class DataHandler:

    def __init__(self, file_name):
        self.file_name = file_name
        self.data = None

    def load_data(self):
        # Read the csv file
        self.data = pd.read_csv(self.file_name)
        print("Data loaded successfully.")
        print("Shape of the dataset (rows, columns):", self.data.shape)
        print("\nFirst 5 rows:")
        print(self.data.head())
        print("\nColumn information:")
        print(self.data.info())
        print("\nStatistical summary:")
        print(self.data.describe())
        return self.data

    def clean_data(self):
        # Check missing values
        print("\nMissing values in each column:")
        print(self.data.isnull().sum())

        # In this dataset, 0 is not possible for these columns,
        # so zeros actually mean missing values.
        cols_with_zero = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]

        # Replace 0 with NaN, then fill with the median of that column
        for col in cols_with_zero:
            self.data[col] = self.data[col].replace(0, np.nan)
            self.data[col] = self.data[col].fillna(self.data[col].median())

        print("\nZero values replaced with median. Data cleaned.")
        return self.data
