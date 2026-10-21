"""
=============================================================================
Project Title : AI-Driven Customer Segmentation for Retail Optimization
Purpose       : College Assignment & Viva-Ready Machine Learning Project
Algorithm     : K-Means Clustering (Unsupervised Learning) + Elbow Method
=============================================================================
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans

# Set visualization style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)

print("=" * 70)
print(" AI-DRIVEN CUSTOMER SEGMENTATION FOR RETAIL OPTIMIZATION ")
print("=" * 70)

# ---------------------------------------------------------------------------
# STEP 1: LOAD DATASET
# ---------------------------------------------------------------------------
print("\n[STEP 1] Loading Dataset...")
data_path = "Mall_Customers.csv"
df = pd.read_csv(data_path)

print(f"-> Dataset successfully loaded! Total Records: {df.shape[0]} rows, {df.shape[1]} columns.")
print("\nFirst 5 Records:")
print(df.head())

# ---------------------------------------------------------------------------
# STEP 2: DATA INSPECTION & EXPLORATORY DATA ANALYSIS (EDA)
# ---------------------------------------------------------------------------
print("\n" + "-" * 70)
print("[STEP 2] Inspecting Dataset Details & Missing Values...")
print(f"Missing Values:\n{df.isnull().sum()}")
print("\nBasic Statistical Summary:")
print(df[['Age', 'Annual Income (k$)', 'Spending Score (1-100)']].describe())

# ---------------------------------------------------------------------------
# STEP 3: FEATURE SELECTION
# ---------------------------------------------------------------------------
# For retail optimization, the two most critical drivers are:
# 1. Annual Income (k$) -> How much purchasing power the customer has
# 2. Spending Score (1-100) -> How willing the customer is to spend in the store
print("\n" + "-" * 70)
print("[STEP 3] Selecting Features for Clustering...")
X = df.iloc[:, [3, 4]].values  # Columns: Annual Income (k$), Spending Score (1-100)
print(f"Selected Features Shape: {X.shape} (Annual Income vs Spending Score)")

# ---------------------------------------------------------------------------
# STEP 4: FINDING OPTIMAL NUMBER OF CLUSTERS (THE ELBOW METHOD)
# ---------------------------------------------------------------------------
# WCSS = Within-Cluster Sum of Squares (measures squared distance of points from their centroid)
print("\n" + "-" * 70)
print("[STEP 4] Running Elbow Method to find optimal 'K' (number of clusters)...")

wcss = []
k_range = range(1, 11)

for k in k_range:
    kmeans = KMeans(n_clusters=k, init='k-means++', random_state=42, n_init=10)
    kmeans.fit(X)
    wcss.append(kmeans.inertia_)
    print(f"  k = {k:2d} -> WCSS (Inertia) = {kmeans.inertia_:.2f}")

# Plotting Elbow Graph
plt.figure(figsize=(9, 5))
plt.plot(k_range, wcss, marker='o', color='#2b5c8f', linewidth=2, markersize=8)
plt.title('The Elbow Method for Optimal K', fontsize=15, fontweight='bold', pad=15)
plt.xlabel('Number of Clusters (K)', fontsize=12)
plt.ylabel('WCSS (Within-Cluster Sum of Squares)', fontsize=12)
plt.xticks(k_range)

# Annotate the elbow point (K=5)
plt.axvline(x=5, color='red', linestyle='--', label='Elbow Point (Optimal K = 5)')
plt.legend(fontsize=11)
plt.tight_layout()
plt.savefig('elbow_method.png', dpi=300)
plt.close()
print("-> Elbow Method chart saved as 'elbow_method.png'.")
print("-> Observation: The rate of decrease sharply slows down after K = 5 (Elbow Point).")

# ---------------------------------------------------------------------------
# STEP 5: TRAINING THE K-MEANS MODEL (K = 5)
# ---------------------------------------------------------------------------
print("\n" + "-" * 70)
print("[STEP 5] Training K-Means Model with K = 5 clusters...")
optimal_k = 5
kmeans = KMeans(n_clusters=optimal_k, init='k-means++', random_state=42, n_init=10)
y_kmeans = kmeans.fit_predict(X)

# Add cluster labels to our original dataframe
df['Cluster'] = y_kmeans

# Map friendly business segment names
cluster_labels_map = {
    0: "Sensible Shoppers (Low Income, Low Spending)",
    1: "Standard Shoppers (Medium Income, Medium Spending)",
    2: "Target / VIP Customers (High Income, High Spending)",
    3: "Careless Shoppers (Low Income, High Spending)",
    4: "Careful / Savers (High Income, Low Spending)"
}

# Dynamically align cluster names based on centroid locations
centroids = kmeans.cluster_centers_
named_clusters = {}
for i, center in enumerate(centroids):
    inc, score = center[0], center[1]
    if inc > 65 and score > 65:
        named_clusters[i] = "Target / VIP Customers (High Income, High Spend)"
    elif inc > 65 and score < 40:
        named_clusters[i] = "Careful Savers (High Income, Low Spend)"
    elif inc < 40 and score > 65:
        named_clusters[i] = "Careless / Impulsive (Low Income, High Spend)"
    elif inc < 40 and score < 40:
        named_clusters[i] = "Sensible / Budget (Low Income, Low Spend)"
    else:
        named_clusters[i] = "Standard / Moderate (Medium Income, Medium Spend)"

df['Cluster_Name'] = df['Cluster'].map(named_clusters)

# Save segmented output to CSV
df.to_csv("segmented_customers.csv", index=False)
print("-> Customer segment results saved to 'segmented_customers.csv'.")

# ---------------------------------------------------------------------------
# STEP 6: VISUALIZING THE CLUSTERS & CENTROIDS
# ---------------------------------------------------------------------------
print("\n" + "-" * 70)
print("[STEP 6] Generating Cluster Visualization Plot...")

colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22']
plt.figure(figsize=(11, 7))

for i in range(optimal_k):
    cluster_points = X[y_kmeans == i]
    plt.scatter(
        cluster_points[:, 0],
        cluster_points[:, 1],
        s=80,
        c=colors[i],
        label=named_clusters[i],
        alpha=0.85,
        edgecolor='black',
        linewidth=0.5
    )

# Plotting the Centroids (Cluster centers)
plt.scatter(
    centroids[:, 0],
    centroids[:, 1],
    s=250,
    c='yellow',
    marker='X',
    edgecolor='black',
    linewidth=1.5,
    label='Cluster Centroids (Centers)'
)

plt.title('AI-Driven Customer Segmentation (Retail Clusters)', fontsize=16, fontweight='bold', pad=15)
plt.xlabel('Annual Income (in Thousand $)', fontsize=12)
plt.ylabel('Spending Score (1 to 100)', fontsize=12)
plt.legend(bbox_to_anchor=(1.02, 1), loc='upper left', fontsize=10)
plt.tight_layout()
plt.savefig('customer_clusters.png', dpi=300)
plt.close()
print("-> Cluster visualization plot saved as 'customer_clusters.png'.")

# ---------------------------------------------------------------------------
# STEP 7: RETAIL OPTIMIZATION STRATEGIES (BUSINESS VALUE)
# ---------------------------------------------------------------------------
print("\n" + "=" * 70)
print(" RETAIL OPTIMIZATION & BUSINESS STRATEGY RECOMMENDATIONS ")
print("=" * 70)

summary_table = df.groupby('Cluster_Name').agg(
    Customer_Count=('CustomerID', 'count'),
    Avg_Age=('Age', 'mean'),
    Avg_Income=('Annual Income (k$)', 'mean'),
    Avg_Spending=('Spending Score (1-100)', 'mean')
).reset_index()

print("\nCluster Statistics Summary:")
print(summary_table.to_string(index=False))

print("\nDetailed Marketing Recommendations for Retail Optimization:")
strategies = {
    "Target / VIP Customers (High Income, High Spend)": 
        "-> PRIORITY: Highest.\n   Strategy: Offer premium loyalty rewards, VIP club membership, early access to new designer collections, personalized concierge services.",
    "Careful Savers (High Income, Low Spend)": 
        "-> PRIORITY: High Growth Opportunity.\n   Strategy: Run value-focused campaigns, showcase high product quality/durability, offer bundle discounts and cashbacks to encourage spending.",
    "Careless / Impulsive (Low Income, High Spend)": 
        "-> PRIORITY: Medium.\n   Strategy: Target with youth trends, seasonal fast-fashion, flash sales, no-cost EMI, and 'Buy Now Pay Later' payment options.",
    "Sensible / Budget (Low Income, Low Spend)": 
        "-> PRIORITY: Retention.\n   Strategy: Offer clearance sales, daily essential discounts, budget-friendly combo packs, and low-cost alternatives.",
    "Standard / Moderate (Medium Income, Medium Spend)": 
        "-> PRIORITY: Steady Revenue.\n   Strategy: Standard seasonal promotions, festival offers, and store membership benefits to retain regular shopping cadence."
}

for cluster_title, recommendation in strategies.items():
    print(f"\n[{cluster_title}]")
    print(recommendation)

# ---------------------------------------------------------------------------
# STEP 8: NEW CUSTOMER PREDICTION DEMO
# ---------------------------------------------------------------------------
def predict_customer_segment(annual_income_k, spending_score):
    """Predict which segment a new customer falls into."""
    sample = np.array([[annual_income_k, spending_score]])
    pred_cluster = kmeans.predict(sample)[0]
    segment_name = named_clusters[pred_cluster]
    return pred_cluster, segment_name

print("\n" + "=" * 70)
print(" LIVE PREDICTION DEMO (How to test new customer in viva) ")
print("=" * 70)
test_income = 85
test_score = 80
cid, cname = predict_customer_segment(test_income, test_score)
print(f"Sample Customer -> Annual Income: ${test_income}k, Spending Score: {test_score}/100")
print(f"Assigned Cluster: Cluster {cid}")
print(f"Segment Category: {cname}")
print("=" * 70)
print("\nPROJECT EXECUTION COMPLETED SUCCESSFULLY!")
