from http.server import BaseHTTPRequestHandler
import json
import joblib
import pandas as pd
import numpy as np
import os

# Load models and scaler once on start
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(current_dir, 'models')

# Load files
scaler = joblib.load(os.path.join(models_dir, 'scaler.pkl'))
lr_model = joblib.load(os.path.join(models_dir, 'lr_model.pkl'))
rf_model = joblib.load(os.path.join(models_dir, 'rf_model.pkl'))
xgb_model = joblib.load(os.path.join(models_dir, 'xgb_model.pkl'))

# Expected columns list in correct order
columns = [
    'blue_dragons', 'blue_towers', 'blue_kills', 'blue_firstBlood', 'blue_voidgrubs',
    'red_dragons', 'red_towers', 'red_kills', 'red_voidgrubs',
    'blue_top_gold', 'blue_top_cs', 'blue_top_kills', 'blue_top_deaths',
    'red_top_gold', 'red_top_cs', 'red_top_kills', 'red_top_deaths', 'top_gold_diff',
    'blue_jungle_gold', 'blue_jungle_cs', 'blue_jungle_kills', 'blue_jungle_deaths',
    'red_jungle_gold', 'red_jungle_cs', 'red_jungle_kills', 'red_jungle_deaths', 'jungle_gold_diff',
    'blue_middle_gold', 'blue_middle_cs', 'blue_middle_kills', 'blue_middle_deaths',
    'red_middle_gold', 'red_middle_cs', 'red_middle_kills', 'red_middle_deaths', 'middle_gold_diff',
    'blue_bottom_gold', 'blue_bottom_cs', 'blue_bottom_kills', 'blue_bottom_deaths',
    'red_bottom_gold', 'red_bottom_cs', 'red_bottom_kills', 'red_bottom_deaths', 'bottom_gold_diff',
    'blue_utility_gold', 'blue_utility_cs', 'blue_utility_kills', 'blue_utility_deaths',
    'red_utility_gold', 'red_utility_cs', 'red_utility_kills', 'red_utility_deaths', 'utility_gold_diff'
]

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Enable CORS for local development
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            input_data = json.loads(post_data.decode('utf-8'))

            # Fill missing keys with default/average values (optional safety fallback)
            data = {}
            for col in columns:
                data[col] = float(input_data.get(col, 0.0))

            # Automatically compute gold diffs to avoid manual errors
            data['top_gold_diff'] = data['blue_top_gold'] - data['red_top_gold']
            data['jungle_gold_diff'] = data['blue_jungle_gold'] - data['red_jungle_gold']
            data['middle_gold_diff'] = data['blue_middle_gold'] - data['red_middle_gold']
            data['bottom_gold_diff'] = data['blue_bottom_gold'] - data['red_bottom_gold']
            data['utility_gold_diff'] = data['blue_utility_gold'] - data['red_utility_gold']

            # Create DataFrame
            df_input = pd.DataFrame([data], columns=columns)

            # Scale for Logistic Regression
            X_scaled = scaler.transform(df_input)

            # Predict probabilities
            lr_prob = float(lr_model.predict_proba(X_scaled)[0, 1])
            rf_prob = float(rf_model.predict_proba(df_input)[0, 1])
            xgb_prob = float(xgb_model.predict_proba(df_input)[0, 1])

            response = {
                'success': True,
                'predictions': {
                    'logistic_regression': {
                        'blue_win_rate': round(lr_prob * 100, 2),
                        'red_win_rate': round((1 - lr_prob) * 100, 2)
                    },
                    'random_forest': {
                        'blue_win_rate': round(rf_prob * 100, 2),
                        'red_win_rate': round((1 - rf_prob) * 100, 2)
                    },
                    'xgboost': {
                        'blue_win_rate': round(xgb_prob * 100, 2),
                        'red_win_rate': round((1 - xgb_prob) * 100, 2)
                    }
                }
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*') # CORS support
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))

        except Exception as e:
            response = {
                'success': False,
                'error': str(e)
            }
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
