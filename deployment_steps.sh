# 1. Train the ML models first
python -m ml.model_trainer

# 2. Start services via Docker Compose
docker-compose up --build

# 3. Or run individually for development:

# Terminal 1 — Flask AI API
python ml/flask_ai_api.py                                                             

# Terminal 2 — FastAPI backend
uvicorn backend.main:app --reload --port 8000

# Terminal 3 — Shipment Generator (writes to Firestore)
python -m backend.shipment_generator

# 4. Deploy Cloud Functions
cd firebase/functions
npm install
firebase deploy --only functions
