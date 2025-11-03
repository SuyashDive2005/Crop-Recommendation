from flask_cors import CORS
from flask import Flask, request, jsonify
import joblib
import numpy as np
import requests
import datetime
import traceback
import os
from dotenv import load_dotenv


app = Flask(__name__)
CORS(app)

# Try to load model and preprocessing tools, but don't crash if missing.
model = None
scaler = None
encoder = None
try:
    if os.path.exists("crop_model.pkl") and os.path.exists("scaler.pkl") and os.path.exists("encoder.pkl"):
        model = joblib.load("crop_model.pkl")
        scaler = joblib.load("scaler.pkl")
        encoder = joblib.load("encoder.pkl")
    else:
        print("Model artifacts not found (crop_model.pkl / scaler.pkl / encoder.pkl). Falling back to heuristics.")
except Exception:
    print("Failed to load model artifacts:")
    traceback.print_exc()

# 🌦️ Fetch live weather + location data dynamically
def get_weather(city):
    API_KEY = os.getenv("OPENWEATHER_API_KEY")  # Replace with your own OpenWeatherMap API key
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={API_KEY}"

    response = requests.get(url)
    data = response.json()

    if response.status_code == 200 and "main" in data:
        temperature = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        rainfall = data.get("rain", {}).get("1h", 0)
        lat = data["coord"]["lat"]
        lon = data["coord"]["lon"]
        return temperature, humidity, rainfall, lat, lon
    else:
        print("Weather API Error:", data)
        return None

# 🌍 Determine region dynamically using latitude
def determine_region(lat):
    if lat > 23.5:
        return "North India"
    elif 8.0 <= lat <= 23.5:
        return "South India"
    else:
        return "Central India"

# 🗓️ Determine season dynamically using both month and temperature
def get_season(temp):
    month = datetime.datetime.now().month
    if 3 <= month <= 6 and temp > 28:
        return "Summer"
    elif 7 <= month <= 10 and temp >= 20:
        return "Monsoon"
    else:
        return "Winter"

# 🌾 Enhanced prediction route
@app.route("/predict", methods=["POST"])
def predict_crop():
    try:
        data = request.get_json(force=True)

        # accept multiple possible field names from frontend/backends
        city = data.get("city") or data.get("City") or ""
        # numeric fields: accept both full names and short N/P/K
        nitrogen = data.get("nitrogen") if data.get("nitrogen") is not None else data.get("N")
        phosphorus = data.get("phosphorus") if data.get("phosphorus") is not None else data.get("P")
        potassium = data.get("potassium") if data.get("potassium") is not None else data.get("K")
        ph = data.get("ph") if data.get("ph") is not None else data.get("pH")

        # Defensive numeric parsing
        try:
            N = float(nitrogen)
        except Exception:
            N = 0.0
        try:
            P = float(phosphorus)
        except Exception:
            P = 0.0
        try:
            K = float(potassium)
        except Exception:
            K = 0.0
        try:
            ph = float(ph)
        except Exception:
            ph = 7.0

        if not city:
            return jsonify({"error": "Missing required field: city"}), 400

        # 🌦️ Live weather fetch (best-effort)
        weather_data = get_weather(city)
        if not weather_data:
            # fallback synthetic weather if external API fails
            temperature, humidity, rainfall, lat, lon = 25.0, 60.0, 50.0, 20.0, 78.0
            region = determine_region(lat)
            season = get_season(temperature)
        else:
            temperature, humidity, rainfall, lat, lon = weather_data
            region = determine_region(lat)
            season = get_season(temperature)

        # If model artifacts are available, use them. Otherwise use a simple rule-based fallback.
        if model is not None and scaler is not None and encoder is not None:
            input_data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
            try:
                scaled_input = scaler.transform(input_data)
                prediction = model.predict(scaled_input)
                crop_name = encoder.inverse_transform(prediction)[0]
            except Exception:
                traceback.print_exc()
                crop_name = "wheat"
        else:
            # Very small heuristic fallback - choose crop by pH and NPK rough ranges
            if ph < 6.0 and N > 80:
                crop_name = "rice"
            elif 6.0 <= ph <= 7.5 and P > 40:
                crop_name = "maize"
            else:
                crop_name = "wheat"

        # human-friendly note
        note = (
            f"Based on current {season.lower()} conditions in {city.title()}, with temperature {temperature}°C and humidity {humidity}%, "
            f"the recommended crop is {str(crop_name).title()}."
        )

        # Return the compact JSON shape the frontend expects
        return jsonify({
            "city": city.title(),
            "temperature": temperature,
            "humidity": humidity,
            "rainfall": rainfall,
            "recommended_crop": str(crop_name).title(),
            "details": {
                "season": season,
                "reason": note,
                "region": region,
            },
        })

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500

@app.route("/")
def home():
    return "🌱 Intelligent Crop Recommendation API (Dynamic Weather, Region, Season) is running!"

if __name__ == "__main__":
    app.run(debug=True)
