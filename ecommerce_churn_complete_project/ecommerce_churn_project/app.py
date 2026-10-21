import streamlit as st
import pandas as pd
import numpy as np

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

# --------------------------------------------------
# E-COMMERCE CUSTOMER CHURN PREDICTION WEB APP
# --------------------------------------------------

st.set_page_config(
    page_title="E-Commerce Churn Prediction",
    page_icon="🛒",
    layout="wide",
)

BASE_DIR = Path(__file__).resolve().parent

# Look for the existing dataset in either project location.
possible_paths = [
    BASE_DIR / "ecommerce_customers.csv",
    BASE_DIR / "ecommerce_churn_project" / "ecommerce_customers.csv",
]

def load_default_data():
    for path in possible_paths:
        if path.exists():
            try:
                return pd.read_csv(path), str(path)
            except Exception as error:
                st.error(f"Could not read {path.name}: {error}")
                return None, None
    return None, None


# --------------------------------------------------
# SIDEBAR
# --------------------------------------------------

st.sidebar.title("🛒 Churn Prediction")
page = st.sidebar.radio(
    "Navigate",
    [
        "Project Overview",
        "Explore Dataset",
        "Train Model",
        "Predict Customers",
    ],
)

st.sidebar.caption("E-Commerce Customer Churn Prediction")
st.sidebar.caption("Python + Machine Learning + Streamlit")


# --------------------------------------------------
# PROJECT OVERVIEW
# --------------------------------------------------

if page == "Project Overview":
    st.title("🛒 E-Commerce Customer Churn Prediction")
    st.subheader("Machine Learning Web Application")

    st.write(
        """
        This application uses customer data to estimate which customers
        may stop using an e-commerce service.

        **Project workflow**
        1. Load customer data.
        2. Explore the dataset.
        3. Train a machine-learning model.
        4. Review model evaluation metrics.
        5. Upload new customers for churn predictions.
        """
    )

    data, path = load_default_data()

    if data is not None:
        st.success(f"Dataset found: {path}")

        col1, col2, col3 = st.columns(3)
        col1.metric("Customer Records", f"{len(data):,}")
        col2.metric("Dataset Columns", len(data.columns))
        col3.metric("Missing Values", int(data.isna().sum().sum()))

        st.write("### Dataset Preview")
        st.dataframe(data.head(10), use_container_width=True)
    else:
        st.warning(
            "The default CSV was not found. Put ecommerce_customers.csv "
            "in the same folder as app.py, or upload it on the Explore Dataset page."
        )


# --------------------------------------------------
# EXPLORE DATASET
# --------------------------------------------------

elif page == "Explore Dataset":
    st.title("📊 Explore Customer Dataset")

    default_data, default_path = load_default_data()

    uploaded_file = st.file_uploader(
        "Upload a customer dataset (CSV)",
        type=["csv"],
        key="explore_upload",
    )

    if uploaded_file is not None:
        try:
            df = pd.read_csv(uploaded_file)
        except Exception as error:
            st.error(f"Unable to read CSV: {error}")
            st.stop()
    elif default_data is not None:
        df = default_data
        st.info(f"Using project dataset: {default_path}")
    else:
        st.info("Upload ecommerce_customers.csv to get started.")
        st.stop()

    st.write("### First 10 Rows")
    st.dataframe(df.head(10), use_container_width=True)

    col1, col2, col3 = st.columns(3)
    col1.metric("Rows", f"{df.shape[0]:,}")
    col2.metric("Columns", df.shape[1])
    col3.metric("Duplicate Rows", int(df.duplicated().sum()))

    st.write("### Column Information")
    info_df = pd.DataFrame({
        "Column": df.columns,
        "Data Type": [str(dtype) for dtype in df.dtypes],
        "Missing Values": [int(value) for value in df.isna().sum()],
        "Unique Values": [int(df[col].nunique(dropna=True)) for col in df.columns],
    })
    st.dataframe(info_df, use_container_width=True)

    st.write("### Missing Values")
    missing = df.isna().sum().sort_values(ascending=False)
    missing = missing[missing > 0]

    if missing.empty:
        st.success("No missing values found.")
    else:
        st.dataframe(
            missing.rename("Missing Count").reset_index().rename(
                columns={"index": "Column"}
            ),
            use_container_width=True,
        )


# --------------------------------------------------
# TRAIN MODEL
# --------------------------------------------------

elif page == "Train Model":
    st.title("🤖 Train Churn Prediction Model")

    default_data, default_path = load_default_data()

    uploaded_file = st.file_uploader(
        "Optionally upload a labeled customer CSV",
        type=["csv"],
        key="train_upload",
        help="The dataset must contain a column showing whether each customer churned.",
    )

    if uploaded_file is not None:
        try:
            df = pd.read_csv(uploaded_file)
        except Exception as error:
            st.error(f"Unable to read CSV: {error}")
            st.stop()
    elif default_data is not None:
        df = default_data
        st.info(f"Using project dataset: {default_path}")
    else:
        st.warning("Upload a labeled customer CSV to train the model.")
        st.stop()

    if len(df.columns) < 2:
        st.error("The dataset needs at least one feature column and one target column.")
        st.stop()

    target_candidates = [
        col for col in df.columns
        if col.lower().replace("_", "").replace(" ", "")
        in ["churn", "churned", "ischurn", "customerchurn", "exited"]
    ]

    default_target_index = (
        list(df.columns).index(target_candidates[0])
        if target_candidates else len(df.columns) - 1
    )

    target = st.selectbox(
        "Select the target column (the column that indicates churn)",
        options=list(df.columns),
        index=default_target_index,
    )

    model_name = st.selectbox(
        "Choose a machine-learning algorithm",
        ["Random Forest", "Logistic Regression"],
    )

    test_size = st.slider(
        "Percentage of data used for testing",
        min_value=10,
        max_value=40,
        value=20,
        step=5,
    )

    if st.button("🚀 Train Model", type="primary"):
        data = df.copy()

        # Remove rows without a known target.
        data = data.dropna(subset=[target])

        # Remove rows with only one target class or no usable target data.
        if data[target].nunique() < 2:
            st.error(
                "The selected target must contain at least two classes, "
                "such as Yes and No or 1 and 0."
            )
            st.stop()

        # Exclude the target and likely identifier columns from the features.
        id_names = {
            "customerid", "customer_id", "customer id",
            "id", "userid", "user_id", "orderid", "order_id",
        }

        feature_columns = [
            col for col in data.columns
            if col != target and col.lower().strip() not in id_names
        ]

        if not feature_columns:
            st.error("No feature columns are available after excluding the target.")
            st.stop()

        X = data[feature_columns].copy()
        y_raw = data[target].astype(str).str.strip()

        # Encode the target classes.
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y_raw)

        if len(label_encoder.classes_) < 2:
            st.error("The target must contain at least two different classes.")
            st.stop()

        if len(data) < 10:
            st.error("Please provide at least 10 labeled customer records.")
            st.stop()

        class_counts = pd.Series(y).value_counts()
        stratify_y = y if class_counts.min() >= 2 else None

        # Identify numeric and categorical columns.
        numeric_features = X.select_dtypes(include=["number"]).columns.tolist()
        categorical_features = [
            col for col in X.columns if col not in numeric_features
        ]

        numeric_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])

        categorical_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ])

        transformers = []

        if numeric_features:
            transformers.append(
                ("numeric", numeric_pipeline, numeric_features)
            )

        if categorical_features:
            transformers.append(
                ("categorical", categorical_pipeline, categorical_features)
            )

        preprocessor = ColumnTransformer(transformers=transformers)

        if model_name == "Random Forest":
            classifier = RandomForestClassifier(
                n_estimators=200,
                random_state=42,
                class_weight="balanced",
            )
        else:
            classifier = LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
            )

        model = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ])

        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X,
                y,
                test_size=test_size / 100,
                random_state=42,
                stratify=stratify_y,
            )

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            st.session_state["churn_model"] = model
            st.session_state["churn_features"] = feature_columns
            st.session_state["churn_target"] = target
            st.session_state["churn_encoder"] = label_encoder
            st.session_state["churn_model_name"] = model_name
            st.session_state["churn_numeric"] = numeric_features
            st.session_state["churn_categorical"] = categorical_features

            st.success("Model trained successfully!")

            st.write("### Model Evaluation")

            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(
                y_test, y_pred, average="weighted", zero_division=0
            )
            recall = recall_score(
                y_test, y_pred, average="weighted", zero_division=0
            )
            f1 = f1_score(
                y_test, y_pred, average="weighted", zero_division=0
            )

            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Accuracy", f"{accuracy:.2%}")
            c2.metric("Precision", f"{precision:.2%}")
            c3.metric("Recall", f"{recall:.2%}")
            c4.metric("F1-score", f"{f1:.2%}")

            st.write("### Confusion Matrix")
            labels = np.arange(len(label_encoder.classes_))
            cm = confusion_matrix(y_test, y_pred, labels=labels)
            cm_df = pd.DataFrame(
                cm,
                index=[f"Actual {name}" for name in label_encoder.classes_],
                columns=[f"Predicted {name}" for name in label_encoder.classes_],
            )
            st.dataframe(cm_df, use_container_width=True)

            st.write("### Classification Report")
            report = classification_report(
                y_test,
                y_pred,
                labels=labels,
                target_names=[str(x) for x in label_encoder.classes_],
                output_dict=True,
                zero_division=0,
            )
            st.dataframe(
                pd.DataFrame(report).transpose().round(3),
                use_container_width=True,
            )

            st.caption(
                "These metrics describe performance on a held-out test set. "
                "They do not guarantee future prediction accuracy."
            )

        except Exception as error:
            st.error(f"Could not train the model: {error}")
            st.info(
                "Check that the target column contains valid labels and that "
                "the CSV does not contain unsupported data."
            )


# --------------------------------------------------
# PREDICT NEW CUSTOMERS
# --------------------------------------------------

elif page == "Predict Customers":
    st.title("🔮 Predict Churn for New Customers")

    model = st.session_state.get("churn_model")
    features = st.session_state.get("churn_features")
    label_encoder = st.session_state.get("churn_encoder")
    numeric_features = st.session_state.get("churn_numeric", [])
    categorical_features = st.session_state.get("churn_categorical", [])

    if model is None:
        st.warning(
            "No model is trained in this session yet. Open Train Model "
            "and train a model first."
        )
        st.stop()

    st.success(
        f"Active model: {st.session_state.get('churn_model_name', 'Machine learning model')}"
    )

    st.write("Upload a CSV containing the same feature columns used during training.")
    uploaded_file = st.file_uploader(
        "Upload new customer records",
        type=["csv"],
        key="predict_upload",
    )

    if uploaded_file is not None:
        try:
            new_data = pd.read_csv(uploaded_file)

            missing_features = [col for col in features if col not in new_data.columns]

            if missing_features:
                st.error(
                    "Your CSV is missing these required columns: "
                    + ", ".join(missing_features)
                )
            else:
                X_new = new_data[features].copy()
                predictions = model.predict(X_new)

                result = new_data.copy()
                result["PredictedChurn"] = label_encoder.inverse_transform(
                    predictions.astype(int)
                )

                if hasattr(model, "predict_proba"):
                    probabilities = model.predict_proba(X_new)
                    classes = list(label_encoder.classes_)

                    churn_class = next(
                        (
                            i for i, value in enumerate(classes)
                            if str(value).strip().lower()
                            in {"1", "yes", "true", "churn", "churned", "exited"}
                        ),
                        None,
                    )

                    if churn_class is not None:
                        result["ChurnProbability"] = probabilities[:, churn_class]

                st.write("### Prediction Results")
                st.dataframe(result, use_container_width=True)

                csv = result.to_csv(index=False).encode("utf-8")

                st.download_button(
                    "⬇️ Download Predictions CSV",
                    data=csv,
                    file_name="customer_churn_predictions.csv",
                    mime="text/csv",
                )

        except Exception as error:
            st.error(f"Prediction failed: {error}")

    st.divider()
    st.write("### Predict One Customer")

    st.caption(
        "Enter values for a single customer. Use the same categories and "
        "formats as in your training dataset."
    )

    default_data, _ = load_default_data()
    input_values = {}

    with st.form("single_customer_form"):
        columns = st.columns(2)

        for index, feature in enumerate(features):
            with columns[index % 2]:
                if feature in numeric_features:
                    default_value = 0.0

                    if default_data is not None and feature in default_data.columns:
                        numeric_values = pd.to_numeric(
                            default_data[feature], errors="coerce"
                        ).dropna()

                        if not numeric_values.empty:
                            default_value = float(numeric_values.median())

                    input_values[feature] = st.number_input(
                        feature,
                        value=default_value,
                    )
                else:
                    choices = []

                    if default_data is not None and feature in default_data.columns:
                        choices = (
                            default_data[feature]
                            .dropna()
                            .astype(str)
                            .unique()
                            .tolist()
                        )

                    if choices:
                        input_values[feature] = st.selectbox(feature, choices)
                    else:
                        input_values[feature] = st.text_input(feature)

        submitted = st.form_submit_button("Predict Customer Churn")

    if submitted:
        single_df = pd.DataFrame([input_values], columns=features)

        try:
            prediction = model.predict(single_df)[0]
            predicted_label = label_encoder.inverse_transform(
                np.array([prediction], dtype=int)
            )[0]

            st.write("### Prediction")
            st.metric("Predicted Churn Class", str(predicted_label))

            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(single_df)[0]
                probability_df = pd.DataFrame({
                    "Class": label_encoder.classes_,
                    "Probability": probabilities,
                })
                probability_df["Probability"] = (
                    probability_df["Probability"] * 100
                ).round(2)

                st.write("### Class Probabilities")
                st.dataframe(probability_df, use_container_width=True)

            st.caption(
                "This is a model estimate, not a guarantee of customer behavior."
            )

        except Exception as error:
            st.error(f"Could not predict this customer: {error}")