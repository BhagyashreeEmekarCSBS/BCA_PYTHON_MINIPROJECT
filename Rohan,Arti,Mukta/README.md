# 🚦 Mini Project 4: Urban Traffic Flow Optimization & Volume Prediction System

An end-to-end Machine Learning and Urban Data Science project for analyzing historical freeway traffic patterns, isolating major congestion drivers (weather, hour, day of week, holidays), and forecasting real-time traffic volume with **96.07% accuracy ($R^2 = 0.9607$)**.

---

## 📌 Project Overview 

Increasing traffic congestion is a major problem in urban areas. Traffic volume depends on multiple interrelated dynamic factors such as time of day, weather conditions, temperature, holidays, and day of the week.

This project delivers:
1. **Fully Executed Jupyter Notebook (`Urban_Traffic_Flow_Optimization.ipynb`)**:
   - Structured step-by-step into 8 phases with 27 rich cells.
   - **Every single cell contains in-depth analytical insights and real-world domain interpretations below its output.**
   - Includes full data cleaning, anomaly detection, peak-hour analysis, correlation heatmaps, cyclical feature engineering, multi-model benchmarking, and residual diagnostics.
2. **Multi-Model Machine Learning Tournament**:
   - Compares 5 distinct regression algorithms: Linear Regression, Ridge Regression, Decision Tree, Random Forest, and Hist Gradient Boosting.
   - **Champion Model**: **Hist Gradient Boosting Regressor** with **$R^2 = 96.07\%$**, $RMSE = 394.11$, and $MAE = 224.30$.
3. **Saved Production Model Artifacts**:
   - Serialized champion model saved to `models/traffic_model.pkl`.
   - Complete metadata, feature lists, and benchmark metrics saved to `models/model_metadata.json`.
4. **Interactive Glassmorphic Web Dashboard**:
   - Modern, responsive web application (`app.py`, HTML5, CSS3, JavaScript).
   - Real-time speedometer volume gauge, dynamic 24-hour flow curve chart, scenario presets (Morning Rush, Winter Blizzard, Midday Free Flow), and operational advisory warnings.

---

## 📂 Project Directory Structure

```text
r:/Python Mini Project/
├── Dataset/
│   ├── Metro_Interstate_Traffic_Volume.csv           # Full official raw dataset (UCI Machine Learning Repository)
│   └── Metro-Interstate-Traffic-Volume- Encoded.csv  # Cleaned and encoded dataset
├── models/
│   ├── traffic_model.pkl                             # Trained champion machine learning model (R² 96.07%)
│   └── model_metadata.json                           # Metadata, feature names, category mappings, metrics
├── static/
│   ├── css/
│   │   └── style.css                                 # Premium dark mode glassmorphic styling & animations
│   └── js/
│       └── app.js                                    # Real-time interactive UI, gauge, and canvas chart logic
├── templates/
│   └── index.html                                    # Web dashboard interface with simulation controls
├── Urban_Traffic_Flow_Optimization.ipynb             # Master executed Jupyter Notebook with outputs & insights
├── train_model.py                                    # Standalone script to train & export models
├── generate_master_notebook.py                       # Automated builder script for the notebook
├── app.py                                            # Flask web server & REST API
├── run_dashboard.bat                                 # Windows one-click launcher for the web dashboard
└── README.md                                         # Project documentation
```

---

## 🏆 Machine Learning Model Benchmark Results

Evaluated on **9,641 unseen hourly test records** from Interstate 94:

| Model Architecture | Model Family | $R^2$ Score | Explained Variance | RMSE (Veh/Hr) | MAE (Veh/Hr) | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Hist Gradient Boosting** | **Gradient Boosted Trees (LightGBM)** | **0.9607** | **96.07%** | **394.11** | **224.30** | 🏆 **Champion** |
| **Random Forest Regressor** | Ensemble Bagging (100 Trees) | 0.9580 | 95.80% | 407.35 | 222.89 | Runner-up |
| **Decision Tree Regressor** | Non-Linear CART (Depth 12) | 0.9411 | 94.11% | 482.73 | 267.94 | Strong Baseline |
| **Ridge Regression ($L_2$)** | Regularized Linear | 0.7198 | 71.98% | 1052.49 | 822.89 | Baseline |
| **Linear Regression (OLS)** | Ordinary Least Squares | 0.7198 | 71.98% | 1052.49 | 822.91 | Baseline |

---

## 💡 Key Research & Analytical Insights (हर Cell के Insights का सारांश)

1. **Bimodal Commute Curves (पीक आवर्स)**:
   - Traffic exhibits two daily surges: **Morning Rush (07:00 - 09:00 AM)** peaking at ~4,800 veh/hr and **Evening Rush (04:00 - 06:00 PM)** peaking at ~5,300 veh/hr.
   - Overnight trough occurs between **01:00 AM and 04:00 AM** (< 500 veh/hr, ~88% reduction).
2. **Weekday vs. Weekend Commute Divergence**:
   - Weekdays have a classic sharp two-hump camel curve.
   - Weekends follow a smooth unimodal bell curve peaking between 12:00 PM and 04:00 PM (~3,800 veh/hr).
   - Sunday traffic is ~35% lower than mid-week Tuesday-Thursday traffic.
3. **Weather Sensitivity & Highway Capacity**:
   - Severe weather (Squalls, Heavy Snow, Thunderstorms) drops effective roadway capacity by **15% to 35%**.
   - Sub-zero freezing temperatures ($< -15^\circ\text{C}$) reduce discretionary travel by ~12%.
4. **Holiday Commute Collapse**:
   - On state/national holidays (Thanksgiving, Christmas, Labor Day), the morning rush hour completely disappears, reducing morning volume by over 2,500 veh/hr.
5. **Cyclical Feature Transformation ($\sin/\cos$)**:
   - Standard integer hours treat 23:00 and 00:00 as 23 units apart. Projecting hours onto trigonometric unit circles ($\sin(2\pi t/24), \cos(2\pi t/24)$) maintains continuous mathematical proximity across the midnight boundary.
6. **Data Cleaning & Sensor Anomalies**:
   - Detected and rectified **0.0 Kelvin** temperature sensor dropouts using seasonal median imputation.
   - Rectified an extreme **9,831.3 mm/hr** rainfall telemetry glitch by capping severe precipitation to 100 mm/hr.

---

## 🚀 How to Run the Project (प्रोजेक्ट कैसे चलाएं)

### 1. Open and Run the Jupyter Notebook
Open `Urban_Traffic_Flow_Optimization.ipynb` in VS Code or JupyterLab:
```bash
jupyter notebook Urban_Traffic_Flow_Optimization.ipynb
```
All outputs, graphs, tables, and analytical explanations are already executed and saved inside the notebook.

### 2. Run the Interactive Web Dashboard
You can run the web app with a single click:
- **Option A**: Double-click `run_dashboard.bat`.
- **Option B**: Run from command prompt:
```bash
py -3.11 app.py
```
Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

### 3. Retrain Models
To retrain and re-export the models:
```bash
py -3.11 train_model.py
```

---
How Exactly It looks Like

<img width="2880" height="3741" alt="image" src="https://github.com/user-attachments/assets/a92fa655-668c-4f62-8b92-1ace52a7f649" />


## 🏛️ Strategic Urban Traffic Management Recommendations
1. **Dynamic On-Ramp Metering**: Adjust traffic light timing at highway access ramps dynamically 15 minutes prior to predicted peak build-up.
2. **Predictive Congestion Tolling**: Implement variable pricing ahead of anticipated 4,800+ veh/hr periods to incentivize 10-15% of commuters to shift travel times.
3. **Preemptive Winter Dispatch**: Deploy snowplows and road salting trucks 60 minutes before predicted snowfall during rush hours.
4. **Variable Speed Limit (VSL) Automation**: Lower advisory highway speed limits by 10 mph automatically during heavy rain or freezing conditions.
