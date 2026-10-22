import pandas as pd

df = pd.read_csv("Salary_Data.csv")

print("Dataset loaded successfully!")
print("\nFirst five records:")
print(df.head())

print("\nDataset shape:")
print(df.shape)

print("\nColumn names:")
print(df.columns.tolist())