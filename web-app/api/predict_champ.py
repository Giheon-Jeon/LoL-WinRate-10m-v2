from http.server import BaseHTTPRequestHandler
import json
import joblib
import pandas as pd
import numpy as np
import os

# Load trained champion models once on startup
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(current_dir, 'models')
frontend_data_dir = os.path.join(current_dir, '..', 'src', 'data')

# Load champion metadata to get the correct column order
with open(os.path.join(frontend_data_dir, 'champ_metadata.json'), 'r', encoding='utf-8') as f:
    champ_metadata = json.load(f)
champions = champ_metadata['champions'] # 172 champions

# Load pickles
lr_champ = joblib.load(os.path.join(models_dir, 'lr_champ.pkl'))
rf_champ = joblib.load(os.path.join(models_dir, 'rf_champ.pkl'))
xgb_champ = joblib.load(os.path.join(models_dir, 'xgb_champ.pkl'))

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
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

            blue_champs = input_data.get('blue_champions', [])
            red_champs = input_data.get('red_champions', [])

            # Form input row of size 172
            row = np.zeros(len(champions))
            champ_to_idx = {name: idx for idx, name in enumerate(champions)}

            for name in blue_champs:
                if name in champ_to_idx:
                    row[champ_to_idx[name]] = 1.0

            for name in red_champs:
                if name in champ_to_idx:
                    row[champ_to_idx[name]] = -1.0

            # Convert to DataFrame
            df_input = pd.DataFrame([row], columns=champions)

            # Predict probabilities
            lr_prob = float(lr_champ.predict_proba(df_input)[0, 1])
            rf_prob = float(rf_champ.predict_proba(df_input)[0, 1])
            xgb_prob = float(xgb_champ.predict_proba(df_input)[0, 1])

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
            self.send_header('Access-Control-Allow-Origin', '*')
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
