
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Step 1: Load the dataset
df = pd.read_csv("Salary_Data.csv")

# Step 2: Display the first five records
print("First five records:")
print(df.head())

# Step 3: Check dataset information
print("\nDataset information:")
print(df.info())

# Step 4: Calculate salary statistics
print("\nSalary statistics:")
print(df["Salary"].describe())

# Step 5: Check missing values
print("\nMissing values:")
print(df.isnull().sum())

# Step 6: Plot experience vs salary
plt.figure(figsize=(8, 5))
sns.scatterplot(
    data=df,
    x="YearsExperience",
    y="Salary"
)

plt.title("Years of Experience vs Salary")
plt.xlabel("Years of Experience")
plt.ylabel("Salary")
plt.grid(True)
plt.tight_layout()
plt.show()

# STEP 7: Prepare input and output data

X = df[["YearsExperience"]]  # Input feature
y = df["Salary"]             # Target to predict

print("\nInput data (X):")
print(X.head())

print("\nTarget data (y):")
print(y.head())


# STEP 8: Split data into training and testing sets

from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.20,
    random_state=42
)

print("\nTraining records:", len(X_train))
print("Testing records:", len(X_test))


# STEP 9: Create and train the model

from sklearn.linear_model import LinearRegression

model = LinearRegression()

model.fit(X_train, y_train)

print("\nLinear Regression model trained successfully!")

print("Slope:", model.coef_[0])
print("Intercept:", model.intercept_)


# STEP 10: Predict salaries for test records

y_pred = model.predict(X_test)

print("\nActual vs Predicted Salaries:")

for actual, predicted in zip(y_test, y_pred):
    print(
        f"Actual: {actual:.2f} | "
        f"Predicted: {predicted:.2f}"
    )


# STEP 11: Evaluate model performance

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print("\n--- MODEL PERFORMANCE ---")
print(f"MAE  : {mae:.2f}")
print(f"MSE  : {mse:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R2   : {r2:.4f}")
with open("model_metrics.txt", "w") as file:
    file.write("MODEL PERFORMANCE\n")
    file.write(f"MAE: {mae:.2f}\n")
    file.write(f"MSE: {mse:.2f}\n")
    file.write(f"RMSE: {rmse:.2f}\n")
    file.write(f"R2 Score: {r2:.4f}\n")

print("Model metrics saved successfully!")
# STEP 12: Predict salary for a new employee

experience = 3.0

new_employee = pd.DataFrame({
    "YearsExperience": [experience]
})

predicted_salary = model.predict(new_employee)[0]

print("\n--- NEW EMPLOYEE PREDICTION ---")
print("Years of Experience:", experience)
print(f"Predicted Salary: {predicted_salary:,.2f}")
# STEP 13: Visualize the Linear Regression Model

plt.figure(figsize=(8, 5))

# Show the actual employee salary data
plt.scatter(
    X["YearsExperience"],
    y,
    color="blue",
    label="Actual Salary"
)

# Sort experience values so the regression line looks smooth
X_sorted = X.sort_values(by="YearsExperience")

# Draw the model's predicted salary line
y_line = model.predict(X_sorted)

plt.plot(
    X_sorted["YearsExperience"],
    y_line,
    color="red",
    label="Regression Line"
)

# Add graph details
plt.title("Employee Salary Prediction using Linear Regression")
plt.xlabel("Years of Experience")
plt.ylabel("Salary")
plt.legend()
plt.grid(True)
plt.savefig("regression_graph.png", dpi=300, bbox_inches="tight")

plt.show()
# STEP 14: Predict salaries for different experience levels

experience_values = [1, 3, 5, 7, 10]

new_employees = pd.DataFrame({
    "YearsExperience": experience_values
})

predicted_salaries = model.predict(new_employees)

print("\n--- SALARY PREDICTIONS FOR DIFFERENT EMPLOYEES ---")

for experience, salary in zip(
    experience_values, predicted_salaries
):
    print(
        f"Experience: {experience} years "
        f"| Predicted Salary: {salary:,.2f}"
    )
    # STEP 15: Take input from the user

print("\n--- EMPLOYEE SALARY PREDICTION SYSTEM ---")

try:
    experience = float(
        input("Enter years of experience: ")
    )

    if experience < 0:
        print("Experience cannot be negative.")

    else:
        new_employee = pd.DataFrame({
            "YearsExperience": [experience]
        })

        predicted_salary = model.predict(new_employee)[0]

        print("\n--- PREDICTION RESULT ---")
        print(f"Years of Experience: {experience}")
        print(f"Predicted Salary: {predicted_salary:,.2f}")

except ValueError:
    print("Please enter a valid number.")