import React, { useState } from "react";
import {
  Sprout,
  CloudRain,
  Droplets,
  MapPin,
  TrendingUp,
  Leaf,
  Sun,
  Cloud,
  ThermometerSun,
} from "lucide-react";

// Types
interface CropResponse {
  city: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  recommended_crop: string;
  details: {
    season: string;
    reason: string;
    region: string;
  };
}

interface FormData {
  city: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  ph: string;
}

// API Service
// Vite exposes environment variables via `import.meta.env`.
// Use `VITE_API_URL` in a .env file (e.g. VITE_API_URL=http://127.0.0.1:5000)
const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_URL &&
    String((import.meta as any).env.VITE_API_URL).trim()) ||
  "http://127.0.0.1:5000";

const getCropRecommendation = async (formData: FormData) => {
  // ensure numeric fields are numbers
  const payload = {
    city: formData.city,
    nitrogen: parseFloat(formData.nitrogen),
    phosphorus: parseFloat(formData.phosphorus),
    potassium: parseFloat(formData.potassium),
    ph: parseFloat(formData.ph),
  };

  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Backend error: ${res.status} ${res.statusText} - ${text || "no details"}`
    );
  }

  const json = await res.json();
  // normalize numeric types to match CropResponse
  return {
    ...json,
    temperature: Number(json.temperature),
    humidity: Number(json.humidity),
    rainfall: Number(json.rainfall),
    recommended_crop: String(json.recommended_crop),
    city: String(json.city),
    details: {
      season: String(json.details?.season || ""),
      reason: String(json.details?.reason || ""),
      region: String(json.details?.region || ""),
    },
  } as CropResponse;
};

// Header Component
const Header: React.FC = () => (
  <header className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sprout className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Smart Crop Recommendation</h1>
        </div>
        <nav className="hidden md:flex gap-6">
          <button className="hover:text-green-200 transition">Home</button>
          <button className="hover:text-green-200 transition">About</button>
          <button className="hover:text-green-200 transition">Contact</button>
        </nav>
      </div>
    </div>
  </header>
);

// Loader Component
const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
    <p className="mt-4 text-green-700 font-medium">
      Analyzing soil and weather data...
    </p>
  </div>
);

// Input Form Component
const InputForm: React.FC<{
  onSubmit: (data: FormData) => void;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<FormData>({
    city: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.nitrogen || parseFloat(formData.nitrogen) < 0)
      newErrors.nitrogen = "Valid nitrogen value required";
    if (!formData.phosphorus || parseFloat(formData.phosphorus) < 0)
      newErrors.phosphorus = "Valid phosphorus value required";
    if (!formData.potassium || parseFloat(formData.potassium) < 0)
      newErrors.potassium = "Valid potassium value required";
    if (
      !formData.ph ||
      parseFloat(formData.ph) < 0 ||
      parseFloat(formData.ph) > 14
    )
      newErrors.ph = "pH must be between 0-14";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto transform transition hover:shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Leaf className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Enter Soil Details</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            City Name
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g., Mumbai, Delhi, Bangalore"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nitrogen (N) - kg/ha
            </label>
            <input
              type="number"
              name="nitrogen"
              value={formData.nitrogen}
              onChange={handleChange}
              placeholder="0-140"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            {errors.nitrogen && (
              <p className="text-red-500 text-sm mt-1">{errors.nitrogen}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phosphorus (P) - kg/ha
            </label>
            <input
              type="number"
              name="phosphorus"
              value={formData.phosphorus}
              onChange={handleChange}
              placeholder="5-145"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            {errors.phosphorus && (
              <p className="text-red-500 text-sm mt-1">{errors.phosphorus}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Potassium (K) - kg/ha
            </label>
            <input
              type="number"
              name="potassium"
              value={formData.potassium}
              onChange={handleChange}
              placeholder="5-205"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            {errors.potassium && (
              <p className="text-red-500 text-sm mt-1">{errors.potassium}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soil pH Level
            </label>
            <input
              type="number"
              step="0.1"
              name="ph"
              value={formData.ph}
              onChange={handleChange}
              placeholder="3.5-9.9"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            {errors.ph && (
              <p className="text-red-500 text-sm mt-1">{errors.ph}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? "Analyzing..." : "🌾 Get Crop Recommendation"}
        </button>
      </div>
    </div>
  );
};

// Weather Details Component
const WeatherDetails: React.FC<{ data: CropResponse }> = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
      <div className="flex items-center gap-2 mb-2">
        <ThermometerSun className="w-5 h-5 text-orange-600" />
        <span className="font-semibold text-gray-700">Temperature</span>
      </div>
      <p className="text-3xl font-bold text-orange-600">
        {data.temperature.toFixed(1)}°C
      </p>
    </div>

    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <Droplets className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-gray-700">Humidity</span>
      </div>
      <p className="text-3xl font-bold text-blue-600">
        {data.humidity.toFixed(1)}%
      </p>
    </div>

    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200">
      <div className="flex items-center gap-2 mb-2">
        <CloudRain className="w-5 h-5 text-cyan-600" />
        <span className="font-semibold text-gray-700">Rainfall</span>
      </div>
      <p className="text-3xl font-bold text-cyan-600">
        {data.rainfall.toFixed(1)} mm
      </p>
    </div>
  </div>
);

// Result Card Component
const ResultCard: React.FC<{ data: CropResponse }> = ({ data }) => {
  const getSeasonIcon = (season: string) => {
    if (season.toLowerCase().includes("summer"))
      return <Sun className="w-6 h-6 text-yellow-500" />;
    if (season.toLowerCase().includes("monsoon"))
      return <CloudRain className="w-6 h-6 text-blue-500" />;
    return <Cloud className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto mt-8 transform transition hover:shadow-2xl animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <Sprout className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Recommended Crop
        </h2>
        <p className="text-5xl font-bold text-green-600 mt-4">
          {data.recommended_crop}
        </p>
        <p className="text-gray-600 mt-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          {data.city}
        </p>
      </div>

      <WeatherDetails data={data} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            {getSeasonIcon(data.details.season)}
            <h3 className="font-semibold text-lg text-gray-800">Best Season</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600 mb-2">
            {data.details.season}
          </p>
          <p className="text-gray-600 text-sm">{data.details.reason}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-lg text-gray-800">
              Suitable Region
            </h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {data.details.region}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Based on climate and soil analysis
          </p>
        </div>
      </div>

      <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
        <p className="text-sm text-gray-700">
          <TrendingUp className="inline w-4 h-4 mr-1 text-green-600" />
          <strong>Pro Tip:</strong> This recommendation is based on real-time
          weather data and soil nutrients analysis using machine learning.
        </p>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [result, setResult] = useState<CropResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getCropRecommendation(formData);
      setResult(data);
    } catch (err) {
      setError(
        "Failed to get recommendation. Please check if the backend server is running and try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Discover the Perfect Crop for Your Soil
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get AI-powered crop recommendations based on your soil nutrients, pH
            levels, and real-time weather data
          </p>
        </div>

        <InputForm onSubmit={handleFormSubmit} loading={loading} />

        {loading && <Loader />}

        {error && (
          <div className="max-w-2xl mx-auto mt-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && !loading && <ResultCard data={result} />}

        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            About This System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                <Cloud className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Real-time Weather
              </h4>
              <p className="text-sm text-gray-600">
                Uses OpenWeather API for accurate climate data
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">ML Powered</h4>
              <p className="text-sm text-gray-600">
                Random Forest model trained on agricultural data
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
                <Leaf className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Smart Analysis
              </h4>
              <p className="text-sm text-gray-600">
                Analyzes soil nutrients and regional patterns
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Smart Crop Recommendation System. Built for farmers,
            students, and agriculture officers.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
