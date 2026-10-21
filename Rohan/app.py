"""
Urban Traffic Flow Optimization - Flask Web Server
Mini Project 4
Exposes REST endpoints for traffic volume prediction and serves the interactive dashboard.
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'traffic_model.pkl')
METADATA_PATH = os.path.join(BASE_DIR, 'models', 'model_metadata.json')

# Load Model & Metadata
if not os.path.exists(MODEL_PATH) or not os.path.exists(METADATA_PATH):
    print("[!] Model or metadata missing. Running train_model.py first...")
    import train_model
    train_model.train_and_evaluate()

model = joblib.load(MODEL_PATH)
with open(METADATA_PATH, 'r') as f:
    metadata = json.load(f)

weather_map = metadata.get('weather_map', {})
weather_categories = metadata.get('weather_categories', list(weather_map.keys()))

def classify_traffic(volume):
    """Categorizes traffic volume into standard highway LOS (Level of Service) bands."""
    if volume < 1500:
        return {
            'level': 'Low Flow',
            'severity': 'low',
            'color': '#10b981',
            'badge': 'Free-Flow (Level of Service A/B)',
            'icon': 'fa-solid fa-circle-check',
            'advice': 'Optimal travel conditions. Minimal delays, average speeds at or above speed limit.'
        }
    elif volume < 3500:
        return {
            'level': 'Moderate Flow',
            'severity': 'moderate',
            'color': '#3b82f6',
            'badge': 'Normal Moving (Level of Service C)',
            'icon': 'fa-solid fa-route',
            'advice': 'Stable traffic flow with minor slowdowns near arterial interchanges and merge zones.'
        }
    elif volume < 5000:
        return {
            'level': 'Heavy Traffic',
            'severity': 'heavy',
            'color': '#f59e0b',
            'badge': 'High Density (Level of Service D)',
            'icon': 'fa-solid fa-triangle-exclamation',
            'advice': 'Approaching peak capacity. Reduced headways, elevated brake shockwave risks.'
        }
    else:
        return {
            'level': 'Severe Congestion',
            'severity': 'severe',
            'color': '#ef4444',
            'badge': 'Gridlock Risk (Level of Service E/F)',
            'icon': 'fa-solid fa-radiation',
            'advice': 'Highway operating at or over saturation limit. Expect stop-and-go delays. Recommend alternative corridors.'
        }

@app.route('/')
def index():
    return render_template('index.html', 
                           metadata=metadata, 
                           weather_categories=weather_categories)

@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    return jsonify(metadata)

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        
        hour = int(data.get('hour', 8))
        day_of_week = int(data.get('day_of_week', 1))
        month = int(data.get('month', 10))
        year = int(data.get('year', 2018))
        is_holiday = int(data.get('is_holiday', 0))
        temp_c = float(data.get('temp_c', 15.0))
        rain_1h = float(data.get('rain_1h', 0.0))
        snow_1h = float(data.get('snow_1h', 0.0))
        clouds_all = int(data.get('clouds_all', 40))
        weather_main = str(data.get('weather_main', 'Clear'))
        
        # Derived fields
        is_weekend = 1 if day_of_week >= 5 else 0
        weather_main_enc = weather_map.get(weather_main, 0)
        
        # Cyclical transformations
        hour_sin = np.sin(2 * np.pi * hour / 24.0)
        hour_cos = np.cos(2 * np.pi * hour / 24.0)
        month_sin = np.sin(2 * np.pi * month / 12.0)
        month_cos = np.cos(2 * np.pi * month / 12.0)
        
        feature_cols = metadata['features']
        input_dict = {
            'hour': hour,
            'day_of_week': day_of_week,
            'month': month,
            'year': year,
            'is_weekend': is_weekend,
            'is_holiday': is_holiday,
            'temp_c': temp_c,
            'rain_1h': rain_1h,
            'snow_1h': snow_1h,
            'clouds_all': clouds_all,
            'weather_main_enc': weather_main_enc,
            'hour_sin': hour_sin,
            'hour_cos': hour_cos,
            'month_sin': month_sin,
            'month_cos': month_cos
        }
        
        X_input = pd.DataFrame([input_dict])[feature_cols]
        predicted_vol = float(model.predict(X_input)[0])
        predicted_vol = max(0.0, round(predicted_vol, 1))
        
        classification = classify_traffic(predicted_vol)
        
        # Generate 24-hour trend for the same day configuration
        day_curve = []
        for h in range(24):
            h_sin = np.sin(2 * np.pi * h / 24.0)
            h_cos = np.cos(2 * np.pi * h / 24.0)
            h_dict = dict(input_dict)
            h_dict['hour'] = h
            h_dict['hour_sin'] = h_sin
            h_dict['hour_cos'] = h_cos
            X_h = pd.DataFrame([h_dict])[feature_cols]
            h_pred = max(0.0, round(float(model.predict(X_h)[0]), 1))
            day_curve.append({
                'hour': h,
                'time_label': f"{h:02d}:00",
                'volume': h_pred
            })
            
        return jsonify({
            'success': True,
            'predicted_volume': int(predicted_vol),
            'classification': classification,
            'day_curve': day_curve,
            'inputs': input_dict
        })
        
    except Exception as e:  # noqa: BLE001
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5000'))
    print("[*] Starting Urban Traffic Optimization Web App...")
    print(f"[+] Dashboard URL: http://127.0.0.1:{port}")
    try:
        app.run(host='127.0.0.1', port=port, debug=False)
    except OSError:
        alt_port = 5001
        print(f"[!] Port {port} is in use, falling back to port {alt_port}...")
        print(f"[+] Dashboard URL: http://127.0.0.1:{alt_port}")
        app.run(host='127.0.0.1', port=alt_port, debug=False)
