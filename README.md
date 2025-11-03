# Smart Crop Recommendation

This repository contains a small web app that recommends crops based on soil nutrient inputs and real-time weather. It has a React + Vite frontend and a Flask backend with a Random Forest model (training script included).

This README describes the project layout, how to run the frontend and backend on Windows (PowerShell), environment variables, API contract, how to train/generate model artifacts, and troubleshooting tips.

---

## Repo structure

```
Crop_recomendation/
├─ Backend/
│  ├─ app.py                # Flask API server
│  ├─ model.py              # Training script: saves crop_model.pkl, scaler.pkl, encoder.pkl
│  ├─ Crop_recommendation.csv
│  └─ requirements.txt     # Python deps
├─ Frontend/
│  ├─ public/
│  ├─ src/
│  │  └─ App.tsx           # Main React app and API client
│  ├─ package.json
│  └─ README.md (optional)
└─ README.md               # (this file)
```

---

## Quick overview

- Frontend: Vite + React + TypeScript. The main UI is `Frontend/src/App.tsx`. It sends POST requests to the backend `/predict` endpoint with soil and city inputs.
- Backend: Flask app `Backend/app.py`. It expects numeric N/P/K/pH and a `city` string, fetches weather from OpenWeather (best-effort), uses saved model artifacts (`crop_model.pkl`, `scaler.pkl`, `encoder.pkl`) if present, otherwise uses a small heuristic fallback.
- Model training: `Backend/model.py` trains a RandomForest on `Crop_recommendation.csv` and writes the .pkl artifacts.

---

## Prerequisites

- Python 3.8+ and pip
- Node.js 18+ and npm
- (Optional) An OpenWeatherMap API key if you want real weather lookups

Windows notes: examples below use PowerShell.

---

## Backend — Setup & Run (PowerShell)

Open a PowerShell terminal and run:

```powershell
# change to backend folder
cd .\Backend

# create & activate venv
python -m venv .venv
. .\.venv\Scripts\Activate

# install python deps
pip install -r .\requirements.txt
```

If you need to train the model (to create `crop_model.pkl`, `scaler.pkl`, `encoder.pkl`):

```powershell
# from Backend/ with venv active
python .\model.py
```

Then run the Flask server:

```powershell
python .\app.py
```

The server defaults to `http://127.0.0.1:5000`.

Notes:

- `app.py` attempts to load the model artifacts if they exist. If not present it will use a simple heuristic to return recommendations so the API still works.
- Replace the OpenWeather API key in `Backend/app.py` (or set an env var) before using real weather data. See the Troubleshooting / Environment section for recommended changes.

---

## Frontend — Setup & Run (PowerShell)

Open another PowerShell terminal and run:

```powershell
cd .\Frontend
npm install
npm run dev
```

Visit the dev server URL printed by Vite (usually `http://localhost:5173`).

Environment variables for the frontend

- Vite uses `import.meta.env` for env variables. To override the backend URL create `Frontend/.env` with:

```
VITE_API_URL=http://127.0.0.1:5000
```

Then restart the dev server.

---

## API: /predict

POST /predict

Request JSON body (example):

```json
{
  "city": "Delhi",
  "nitrogen": 80,
  "phosphorus": 40,
  "potassium": 50,
  "ph": 6.5
}
```

Notes: `Backend/app.py` accepts several field name variations (e.g. `N` as well as `nitrogen`) and defensively parses floats.

Successful response JSON (shape used by frontend):

```json
{
  "city": "Delhi",
  "temperature": 25.0,
  "humidity": 60.0,
  "rainfall": 12.0,
  "recommended_crop": "Wheat",
  "details": {
    "season": "Winter",
    "reason": "Based on current winter conditions in Delhi...",
    "region": "North India"
  }
}
```

Errors: server returns a JSON object with an `error` key and a 4xx/5xx status when something goes wrong.

---

## Troubleshooting

- "Uncaught ReferenceError: process is not defined" in browser

  - Cause: code used `process.env` at runtime. Browsers don't expose `process`. Vite exposes env vars via `import.meta.env`.
  - Fix: use `import.meta.env.VITE_API_URL` in frontend, or create `Frontend/.env` with `VITE_API_URL`.

- Chrome extension errors like `Unchecked runtime.lastError` or `TypeError` from `chrome-extension://...`

  - Cause: browser extensions (e.g., AdBlock) injecting content scripts. Not caused by your app. Test in an incognito window (extensions disabled) to confirm.

- Model not found / No crop_model.pkl

  - If `crop_model.pkl`, `scaler.pkl`, or `encoder.pkl` are missing, run `python model.py` in `Backend/` to generate them. The backend will still run and return heuristic results, but model-based predictions require those files.

- OpenWeather failing / API key
  - `Backend/app.py` contains an example API key variable. Replace it with your own key or update `app.py` to read the API key from an environment variable for security:

```python
# suggested change in app.py
import os
API_KEY = os.environ.get('OPENWEATHER_API_KEY')
# then use API_KEY in the URL
```

In PowerShell you can set it temporarily:

```powershell
$env:OPENWEATHER_API_KEY = "your_api_key_here"
python .\app.py
```

---

## Quick API test examples

PowerShell (Invoke-RestMethod):

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:5000/predict -Method Post -ContentType 'application/json' -Body ('{"city":"Delhi","nitrogen":80,"phosphorus":40,"potassium":50,"ph":6.5}')
```

curl (from PowerShell use curl.exe to avoid aliasing):

```powershell
curl.exe -X POST http://127.0.0.1:5000/predict -H "Content-Type: application/json" -d '{"city":"Delhi","nitrogen":80,"phosphorus":40,"potassium":50,"ph":6.5}'
```

---

## Linting / Type issues

- The frontend uses TypeScript; small cast `as any` is used to access `import.meta.env` safely. If you prefer strict typing, add a `env.d.ts` or extend `ImportMetaEnv` to include `VITE_API_URL`.

Example `env.d.ts` (place in `Frontend/src` or `Frontend/types`):

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Next steps / Recommendations

- Move the OpenWeather API key into an environment variable and read it in `app.py`.
- Optionally implement a small CLI or makefile to train the model and start the backend with one command.
- Add small unit tests for the Flask endpoint and a basic integration test between front and backend.
- Consider shipping example `Frontend/.env.example` and `Backend/.env.example` with instructions.

---

If you'd like, I can:

- Create a `Frontend/.env.example` and `Backend/.env.example` for you.
- Refactor `app.py` to read the OpenWeather key from the environment and document it.
- Add the typed `env.d.ts` to remove the `as any` usage in `App.tsx`.

Tell me which of those you'd like me to apply and I'll make the edits.
