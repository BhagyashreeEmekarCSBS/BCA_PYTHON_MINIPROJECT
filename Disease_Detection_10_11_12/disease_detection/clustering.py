# clustering.py
# This class groups similar patients using KMeans clustering.

import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans


class PatientClustering:

    def __init__(self, data):
        self.data = data.copy()

    def find_clusters(self, n_clusters=3):
        print("\n----- PATIENT CLUSTERING -----")

        # Use only the health attributes (not Outcome)
        X = self.data.drop("Outcome", axis=1)

        # Scale the data
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Elbow method to choose the number of clusters
        inertia = []
        for k in range(1, 11):
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            km.fit(X_scaled)
            inertia.append(km.inertia_)

        plt.figure(figsize=(6, 4))
        plt.plot(range(1, 11), inertia, marker="o")
        plt.title("Elbow Method")
        plt.xlabel("Number of Clusters")
        plt.ylabel("Inertia")
        plt.show()

        # Apply KMeans
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.data["Cluster"] = kmeans.fit_predict(X_scaled)

        print("\nNumber of patients in each cluster:")
        print(self.data["Cluster"].value_counts())

        print("\nAverage values in each cluster:")
        print(self.data.groupby("Cluster").mean())

        print("\nPercentage of diabetic patients in each cluster:")
        print(self.data.groupby("Cluster")["Outcome"].mean() * 100)

        # Plot clusters (Glucose vs BMI)
        plt.figure(figsize=(7, 5))
        sns.scatterplot(x="Glucose", y="BMI", hue="Cluster",
                        data=self.data, palette="Set1")
        plt.title("Patient Clusters (Glucose vs BMI)")
        plt.show()
