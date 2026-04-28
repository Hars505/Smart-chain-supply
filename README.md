<div align="center">

# 🌐 Smart Supply Chain Control Tower

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**A real-time, serverless operational dashboard for modern supply chain logistics.**

[View Live Dashboard](#) </div>

---

## 📖 About The Project

The **Smart Supply Chain Control Tower** is a comprehensive, serverless application designed to modernize logistics operations. It provides a real-time overview of global shipments, tracks live telemetry data, and utilizes a NoSQL backend to flag operational anomalies instantly. 

Coupled with a Python-driven synthetic data engine, this project is built not just for operational tracking, but as a foundation for training machine learning models for demand forecasting and route optimization.

## ✨ Key Features

* **📦 Advanced Order Management:** Denormalized, nested product tracking optimized for high-speed database reads.
* **🛰️ Real-Time Telemetry:** Live tracking of active shipments including IoT data (e.g., GPS coordinates, cold-chain temperatures) using Firestore subcollections.
* **🚨 Anomaly Detection:** Automated logging and dashboard flagging for critical system events like cost spikes or regional route delays.
* **🧠 Machine Learning Ready:** Includes specialized Python architecture to generate large-scale synthetic datasets (`1M+ rows`) for time-series forecasting.
* **⚡ Serverless Architecture:** Fully decentralized backend powered by Firebase Web SDKs and Next.js static site generation.

---

## 🏗️ Project Architecture

```text
📦 Smart-chain-supply
 ┣ 📂 data                               # Machine Learning & Data Engine
 ┃ ┗ 📜 synthetic_training_data_generator.py # Python dataset simulator
 ┣ 📂 frontend                           # Next.js Web Application
 ┃ ┣ 📂 public                           # Static assets
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 components                     # Reusable React UI elements
 ┃ ┃ ┣ 📂 config                         # Firebase & App configurations
 ┃ ┃ ┣ 📂 pages                          # Next.js Application Routes
 ┃ ┃ ┗ 📂 store                          # Global State Management
 ┃ ┣ 📜 next.config.js                   # Static export configuration
 ┃ ┗ 📜 package.json                     # Dependencies and deployment scripts
 ┣ 📜 deployment_steps.sh                # CI/CD & Deployment automation
 ┗ 📜 setup_and_run.sh                   # Environment initialization

 To clone repo
git clone [https://github.com/Hars505/Smart-chain-supply.git](https://github.com/Hars505/Smart-chain-supply.git)
cd Smart-chain-supply

for installing dependencies
cd frontend
npm install


to Configure firebase
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

 -- to run Server 
npm run dev

📊 To genrate Ml datasets
cd ../data
python synthetic_training_data_generator.py

🌐 Deployment
cd frontend
npm run deploy
