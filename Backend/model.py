import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier
import joblib

warnings.filterwarnings("ignore")

# Load dataset
print("✅ Loading Dataset...")
data = pd.read_csv("Crop_recommendation.csv")
print("✅ Dataset Loaded Successfully!")
print(data.head())

# --- Dataset Overview ---
print("\n📊 Dataset Info:")
print(data.info())

print("\n📈 Dataset Description:")
print(data.describe())

# --- Crop Count ---
unique_crops = data['label'].unique()
print(f"\n🌾 Unique Crops: {len(unique_crops)}")
print("Crops List:", unique_crops)

# --- Visualizations ---
plt.figure(figsize=(10, 6))
sns.countplot(
    y="label",
    data=data,
    order=data["label"].value_counts().index,
    hue="label",
    palette="viridis",
    legend=False
)
plt.title("Crop Distribution in Dataset")
plt.xlabel("Count")
plt.ylabel("Crop Type")
plt.tight_layout()
plt.show()

# --- Heatmap (Only Numeric Columns) ---
plt.figure(figsize=(10, 7))
numeric_data = data.select_dtypes(include=["float64", "int64"])
sns.heatmap(numeric_data.corr(), annot=True, cmap="YlGnBu", fmt=".2f")
plt.title("Feature Correlation Heatmap (Numeric Features Only)")
plt.tight_layout()
plt.show()

# --- Feature and Label separation ---
X = data[["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]]
Y = data["label"]

# --- Data scaling and encoding ---
scaler = MinMaxScaler()
encoder = LabelEncoder()

X_scaled = scaler.fit_transform(X)
Y_encoded = encoder.fit_transform(Y)

# --- Train-test split ---
X_train, X_test, Y_train, Y_test = train_test_split(
    X_scaled, Y_encoded, test_size=0.2, random_state=2
)

# --- Model training ---
rf = RandomForestClassifier(
    n_estimators=100, criterion="entropy", random_state=2, max_depth=5
)
rf.fit(X_train, Y_train)

# --- Evaluate ---
y_pred = rf.predict(X_test)
acc = accuracy_score(Y_test, y_pred)
print(f"\n✅ Random Forest Model Accuracy: {acc * 100:.2f}%")

# --- Save model and preprocessing tools ---
joblib.dump(rf, "crop_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(encoder, "encoder.pkl")

print("\n💾 Model, Scaler, and Encoder saved successfully!")

# --- Feature Importance Plot ---
plt.figure(figsize=(8, 6))
importance = rf.feature_importances_
features = X.columns
sns.barplot(x=importance, y=features, palette="Greens_r")
plt.title("Feature Importance in Crop Prediction")
plt.xlabel("Importance Score")
plt.ylabel("Feature")
plt.tight_layout()
plt.show()
