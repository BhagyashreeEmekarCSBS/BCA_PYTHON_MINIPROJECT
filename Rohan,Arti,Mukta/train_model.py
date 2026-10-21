"""
Urban Traffic Flow Optimization - Model Training & Export Script
Mini Project 4
Trains multiple regression models, compares evaluation metrics,
and exports the best performing model along with metadata for the web UI.
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor


def prepare_data():
    raw_path = os.path.join("Dataset", "Metro_Interstate_Traffic_Volume.csv")
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Dataset not found at {raw_path}")

    print("[*] Loading dataset...")
    df = pd.read_csv(raw_path)

    # 1. Handle missing and categorical holiday
    df['holiday'] = df['holiday'].fillna('None')

    # 2. Handle sensor anomalies (temp = 0 Kelvin outlier)
    df.loc[df['temp'] < 200, 'temp'] = np.nan
    df['temp'] = df['temp'].fillna(df['temp'].median())

    # 3. Handle extreme rain anomaly (sensor error 9831 mm)
    df.loc[df['rain_1h'] > 100, 'rain_1h'] = 100

    # 4. Datetime Feature Engineering
    df['date_time'] = pd.to_datetime(df['date_time'])
    df['hour'] = df['date_time'].dt.hour
    df['day_of_week'] = df['date_time'].dt.dayofweek
    df['month'] = df['date_time'].dt.month
    df['year'] = df['date_time'].dt.year
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['is_holiday'] = (df['holiday'] != 'None').astype(int)

    # Cyclical representations of time
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12.0)

    # Temperature in Celsius
    df['temp_c'] = np.round(df['temp'] - 273.15, 2)

    # Weather encoding mapping
    weather_categories = sorted(df['weather_main'].unique().tolist())
    weather_map = {w: i for i, w in enumerate(weather_categories)}
    df['weather_main_enc'] = df['weather_main'].map(weather_map)

    feature_cols = [
        'hour', 'day_of_week', 'month', 'year', 'is_weekend', 'is_holiday',
        'temp_c', 'rain_1h', 'snow_1h', 'clouds_all', 'weather_main_enc',
        'hour_sin', 'hour_cos', 'month_sin', 'month_cos'
    ]
    target_col = 'traffic_volume'

    return df, feature_cols, target_col, weather_categories, weather_map

def train_and_evaluate():
    df, feature_cols, target_col, weather_categories, weather_map = prepare_data()

    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    models = {
        'Linear Regression': LinearRegression(),
        'Ridge Regression': Ridge(alpha=1.0),
        'Decision Tree': DecisionTreeRegressor(max_depth=12, random_state=42),
        'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=16, n_jobs=-1, random_state=42),
        'Hist Gradient Boosting': HistGradientBoostingRegressor(
            max_iter=300, 
            learning_rate=0.08, 
            max_depth=12, 
            l2_regularization=0.5,
            random_state=42
        )
    }

    results = {}
    best_name = None
    best_r2 = -float('inf')
    best_model = None

    print("\n" + "="*60)
    print("MODEL PERFORMANCE BENCHMARK (METRO INTERSTATE TRAFFIC)")
    print("="*60)

    for name, model in models.items():
        print(f"[*] Training {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = float(r2_score(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mae = float(mean_absolute_error(y_test, y_pred))

        results[name] = {
            'R2_Score': round(r2, 4),
            'RMSE': round(rmse, 2),
            'MAE': round(mae, 2),
            'Accuracy_Pct': round(r2 * 100, 2)
        }

        print(f"    --> R² Score: {r2:.4f} ({r2*100:.2f}%) | RMSE: {rmse:.2f} | MAE: {mae:.2f}")

        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            best_model = model

    print("="*60)
    print(f"[+] Champion Model: {best_name} with R²: {best_r2:.4f} ({best_r2*100:.2f}%)")
    print("="*60)

    # Save models directory
    os.makedirs('models', exist_ok=True)
    model_save_path = os.path.join('models', 'traffic_model.pkl')
    joblib.dump(best_model, model_save_path)
    print(f"[+] Saved champion model to: {model_save_path}")

    # Compute hourly traffic averages for frontend reference
    hourly_avg = df.groupby('hour')['traffic_volume'].mean().round(1).to_dict()
    dow_avg = df.groupby('day_of_week')['traffic_volume'].mean().round(1).to_dict()

    metadata = {
        'champion_model': best_name,
        'features': feature_cols,
        'weather_categories': weather_categories,
        'weather_map': weather_map,
        'metrics': results,
        'traffic_stats': {
            'min': float(df['traffic_volume'].min()),
            'max': float(df['traffic_volume'].max()),
            'mean': round(float(df['traffic_volume'].mean()), 2),
            'median': float(df['traffic_volume'].median()),
            'hourly_avg': hourly_avg,
            'day_of_week_avg': dow_avg
        }
    }

    meta_save_path = os.path.join('models', 'model_metadata.json')
    with open(meta_save_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"[+] Saved model metadata to: {meta_save_path}")

    return results, best_name

if __name__ == '__main__':
    train_and_evaluate()
