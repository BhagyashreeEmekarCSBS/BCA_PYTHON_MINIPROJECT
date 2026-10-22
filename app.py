import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from pathlib import Path

# Page configuration
st.set_page_config(
    page_title="Employee Salary Prediction System",
    page_icon="💼"
)

# Page heading
st.title("Employee Salary Prediction System")
st.write("Predict salary based on years of experience.")

# Dataset path
csv_path = Path(__file__).parent / "Salary_data.csv"

try:
    # Load dataset
    data = pd.read_csv(csv_path)

    # Train the Linear Regression model
    @st.cache_resource
    def load_model():
        model = LinearRegression()
        model.fit(data[["YearsExperience"]], data["Salary"])
        return model

    model = load_model()

    # Salary prediction section
    st.subheader("Predict Your Salary")

    experience = st.number_input(
        "Enter years of experience",
        min_value=0.0,
        max_value=50.0,
        value=1.0,
        step=0.5
    )

    if st.button("Predict Salary"):
        input_data = pd.DataFrame({
            "YearsExperience": [experience]
        })

        result = model.predict(input_data)[0]

        st.success(f"Predicted Salary: {result:,.2f}")

    # ---------------------------------
    # REGRESSION GRAPH CODE STARTS HERE
    # ---------------------------------

    st.subheader("Salary Prediction Regression Graph")

    # Create graph
    fig, ax = plt.subplots(figsize=(8, 5))

    # Plot actual dataset values
    ax.scatter(
        data["YearsExperience"],
        data["Salary"],
        color="blue",
        label="Actual Salary"
    )

    # Sort experience values for a smooth regression line
    sorted_data = data.sort_values("YearsExperience")

    # Plot regression line
    ax.plot(
        sorted_data["YearsExperience"],
        model.predict(sorted_data[["YearsExperience"]]),
        color="red",
        label="Regression Line"
    )

    # Graph labels and title
    ax.set_xlabel("Years of Experience")
    ax.set_ylabel("Salary")
    ax.set_title("Employee Salary Prediction")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Display graph on website
    st.pyplot(fig)

    # Close graph after displaying
    plt.close(fig)

    # ---------------------------------
    # REGRESSION GRAPH CODE ENDS HERE
    # ---------------------------------

except Exception as error:
    st.error(f"Error loading project: {error}")