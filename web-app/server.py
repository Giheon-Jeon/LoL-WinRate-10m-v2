from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

# Import the stats-only prediction function
from api.predictor import predict_stats_rate

app = FastAPI(title="LoL 15m Predictor API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/predict")
async def predict(input_data: dict):
    try:
        predictions = predict_stats_rate(input_data)
        return {
            'success': True,
            'predictions': predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount dist directory for serving frontend static files in Docker
current_dir = os.path.dirname(os.path.abspath(__file__))
dist_path = os.path.join(current_dir, 'dist')
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

    # Handle SPA routing
    @app.exception_handler(404)
    async def not_found_handler(request, exc):
        return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=False)
