supply-chain-ai/
├── backend/
│   ├── main.py                  # FastAPI app + WebSocket
│   ├── websocket_manager.py     # WS connection manager
│   ├── firebase_client.py       # Firestore + RTDB client
│   ├── shipment_generator.py    # Live GPS simulator
│   └── requirements.txt
├── ml/
│   ├── anomaly_detector.py      # Isolation Forest model
│   ├── risk_scorer.py           # Weighted risk formula
│   ├── route_optimizer.py       # OR-Tools Dijkstra
│   ├── model_trainer.py         # Training pipeline
│   └── flask_ai_api.py          # Flask endpoint for Cloud Functions
├── firebase/
│   └── functions/
│       └── index.js             # Cloud Function trigger
├── data/
│   └── synthetic_training.py    # Training data generator
└── docker-compose.yml
