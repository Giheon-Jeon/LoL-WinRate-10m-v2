from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
import os
import uvicorn

app = FastAPI(title="LoL 15m Predictor API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and scaler
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(current_dir, 'api', 'models')

scaler = joblib.load(os.path.join(models_dir, 'scaler.pkl'))
lr_model = joblib.load(os.path.join(models_dir, 'lr_model.pkl'))
rf_model = joblib.load(os.path.join(models_dir, 'rf_model.pkl'))
xgb_model = joblib.load(os.path.join(models_dir, 'xgb_model.pkl'))

# Load champion models and metadata
import json
champ_metadata_path = os.path.join(current_dir, 'src', 'data', 'champ_metadata.json')
with open(champ_metadata_path, 'r', encoding='utf-8') as f:
    champ_metadata = json.load(f)
champions = champ_metadata['champions']

lr_champ = joblib.load(os.path.join(models_dir, 'lr_champ.pkl'))
rf_champ = joblib.load(os.path.join(models_dir, 'rf_champ.pkl'))
xgb_champ = joblib.load(os.path.join(models_dir, 'xgb_champ.pkl'))

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

@app.post("/api/predict")
async def predict(input_data: dict):
    try:
        data = {}
        for col in columns:
            data[col] = float(input_data.get(col, 0.0))

        # compute gold diffs
        data['top_gold_diff'] = data['blue_top_gold'] - data['red_top_gold']
        data['jungle_gold_diff'] = data['blue_jungle_gold'] - data['red_jungle_gold']
        data['middle_gold_diff'] = data['blue_middle_gold'] - data['red_middle_gold']
        data['bottom_gold_diff'] = data['blue_bottom_gold'] - data['red_bottom_gold']
        data['utility_gold_diff'] = data['blue_utility_gold'] - data['red_utility_gold']

        df_input = pd.DataFrame([data], columns=columns)
        X_scaled = scaler.transform(df_input)

        lr_prob = float(lr_model.predict_proba(X_scaled)[0, 1])
        rf_prob = float(rf_model.predict_proba(df_input)[0, 1])
        xgb_prob = float(xgb_model.predict_proba(df_input)[0, 1])

        return {
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict_champ")
async def predict_champ(input_data: dict):
    try:
        blue_champs = input_data.get('blue_champions', [])
        red_champs = input_data.get('red_champions', [])

        row = np.zeros(len(champions))
        champ_to_idx = {name: idx for idx, name in enumerate(champions)}

        for name in blue_champs:
            if name in champ_to_idx:
                row[champ_to_idx[name]] = 1.0

        for name in red_champs:
            if name in champ_to_idx:
                row[champ_to_idx[name]] = -1.0

        df_input = pd.DataFrame([row], columns=champions)

        lr_prob = float(lr_champ.predict_proba(df_input)[0, 1])
        rf_prob = float(rf_champ.predict_proba(df_input)[0, 1])
        xgb_prob = float(xgb_champ.predict_proba(df_input)[0, 1])

        return {
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount dist directory for serving frontend static files in Docker
dist_path = os.path.join(current_dir, 'dist')
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

    # Handle SPA routing
    @app.exception_handler(404)
    async def not_found_handler(request, exc):
        return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=False)
