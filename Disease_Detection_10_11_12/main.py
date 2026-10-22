# main.py
# Mini Project 3: Disease Pattern Detection
# Run only this file:  python main.py
# Keep diabetes.csv in the same folder as this file.

import matplotlib.pyplot as plt

from disease_detection.data_handler import DataHandler
from disease_detection.analyzer import DataAnalyzer
from disease_detection.clustering import PatientClustering
from disease_detection.predictor import DiabetesPredictor
from disease_detection.gui import DiabetesApp


def main():
    # Step 1: Load and clean the data
    handler = DataHandler("diabetes.csv")
    handler.load_data()
    data = handler.clean_data()

    # The analysis is done here, but its charts are not displayed, so the
    # input form opens first.
    plt.ioff()
    original_show = plt.show
    plt.show = lambda *args, **kwargs: None

    try:
        # Step 2: EDA and correlation analysis
        analyzer = DataAnalyzer(data)
        analyzer.show_eda()
        analyzer.show_correlation()

        # Step 3: Clustering
        clustering = PatientClustering(data)
        clustering.find_clusters(n_clusters=3)

        # Step 4: Build and evaluate the classification model
        predictor = DiabetesPredictor(data)
        predictor.train_model()
        predictor.evaluate_model()
    finally:
        plt.show = original_show
        plt.close("all")

    # Step 5: Open the GUI for predicting a new patient
    print("\nOpening the prediction window...")
    print("Every patient's details are saved to patient_records.xlsx.")
    app = DiabetesApp(predictor)
    app.run()


if __name__ == "__main__":
    main()
