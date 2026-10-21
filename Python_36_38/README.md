# AI-Driven Customer Segmentation for Retail Optimization

## 📌 Project Overview
This project applies **Unsupervised Machine Learning (K-Means Clustering)** to segment retail customers based on their **Annual Income** and **Spending Score**. 

By grouping customers into distinct behavioral segments, retail businesses can optimize:
1. Targeted marketing campaigns (VIP rewards vs discount deals)
2. Product pricing & bundle offers
3. Customer churn prevention and store revenue

---

## 📂 Project Structure
```
c:/python_project/
│
├── Mall_Customers.csv         # Retail customer dataset (200 records)
├── customer_segmentation.py   # Complete end-to-end Python pipeline
├── elbow_method.png           # Elbow method graph showing optimal K=5
├── customer_clusters.png      # 2D scatter plot of 5 customer segments & centroids
├── segmented_customers.csv    # Output data with assigned clusters & category names
└── README.md                  # Project documentation & Viva preparation guide
```

---

## ⚙️ How to Run
Run the Python script in terminal or command prompt:
```bash
python customer_segmentation.py
```

---

## 📊 The 5 Customer Segments & Retail Strategies

| Cluster | Segment Name | Income | Spending | Retail Optimization Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Cluster 1** | **Target / VIP Customers** | High | High | **Top Priority**: Exclusive loyalty programs, early product access, VIP concierge services. |
| **Cluster 2** | **Careful Savers** | High | Low | **Growth Opportunity**: Show value propositions, quality guarantees, and cash-back/bundle offers. |
| **Cluster 3** | **Standard / Moderate** | Medium | Medium | **Steady Base**: Regular seasonal discounts, festival promotions, store membership. |
| **Cluster 4** | **Careless / Impulsive** | Low | High | **Youth/Trend Focus**: Fast-fashion trends, flash sales, No-cost EMI, Buy-Now-Pay-Later (BNPL). |
| **Cluster 5** | **Sensible / Budget** | Low | Low | **Budget Shoppers**: Clearance sales, low-cost essentials, volume discount packs. |

---

## 🎓 Viva / Interview Preparation (Top Questions & Direct Answers)

### Q1: What is Customer Segmentation and why use AI/Machine Learning?
**Ans:** Customer segmentation divides diverse store customers into distinct homogeneous groups based on shared traits (income, spending habits). Machine learning (K-Means) is unsupervised — it discovers natural hidden clusters without requiring manual rule-setting.

### Q2: How does K-Means Clustering algorithm work?
**Ans:** 
1. Initializes $K$ cluster centers (centroids) randomly or using `k-means++`.
2. Assigns each customer to the nearest centroid (based on Euclidean distance).
3. Re-calculates centroid positions by taking the mean of all points in each cluster.
4. Repeats until centroids stop moving (convergence).

### Q3: What is the Elbow Method and WCSS?
**Ans:** 
* **WCSS (Within-Cluster Sum of Squares / Inertia):** Sum of squared distances between each point and its assigned cluster centroid.
* **Elbow Method:** We plot WCSS against different values of $K$ (e.g., 1 to 10). As $K$ increases, WCSS decreases. The point where the graph bends sharply like an **"elbow"** (here at $K=5$) is chosen as the optimal number of clusters.

### Q4: Why did we pick Annual Income and Spending Score?
**Ans:** These two features represent the primary buying dynamics in retail:
* **Annual Income** reflects customer purchasing capacity.
* **Spending Score** reflects retail store engagement and willingness to spend.

### Q5: What are the yellow 'X' markers in the cluster plot?
**Ans:** They represent the **Centroids (Cluster Centers)**. A centroid is the arithmetic mean of all customer points belonging to that cluster.
