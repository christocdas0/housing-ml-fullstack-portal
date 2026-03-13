"""
train_model.py
==============
Script to train a Linear Regression model on the housing dataset.

What this script does (step by step):
  1. Load the CSV dataset
  2. Explore and validate the data
  3. Split into features (X) and target (y)
  4. Split data into training set and test set
  5. Train a Linear Regression model
  6. Evaluate the model (R², MAE, RMSE)
  7. Save the trained model  → model.pkl
  8. Save the evaluation metrics → metrics.json

Run this script once before starting the API:
  python train_model.py

Author : Christo
"""

import os
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

# Get the directory where this script lives
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Dataset path — check two locations:
#   1. Same level as script: BASE_DIR/datasets/  (inside Docker: /app/datasets/)
#   2. One level up:         BASE_DIR/../datasets/ (local dev)
_docker_path = os.path.join(BASE_DIR, "datasets", "housing_dataset.csv")
_local_path  = os.path.join(BASE_DIR, "..", "datasets", "housing_dataset.csv")

DATASET_PATH = _docker_path if os.path.exists(_docker_path) else _local_path

# Where to save the trained model and metrics
MODEL_PATH   = os.path.join(BASE_DIR, "model.pkl")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — LOAD DATA
# ─────────────────────────────────────────────────────────────────────────────

print("=" * 60)
print("  Housing Price Prediction — Model Training")
print("=" * 60)

print("\n[1/6] Loading dataset ...")
df = pd.read_csv(DATASET_PATH)

print(f"      Rows loaded   : {len(df)}")
print(f"      Columns found : {list(df.columns)}")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — VALIDATE & EXPLORE DATA
# ─────────────────────────────────────────────────────────────────────────────

print("\n[2/6] Validating data ...")

# Drop the 'id' column — it is not a feature, just an identifier
df = df.drop(columns=["id"])

# Check for missing values
missing = df.isnull().sum()
if missing.any():
    print(f"      WARNING: Missing values found:\n{missing[missing > 0]}")
    df = df.dropna()
    print(f"      Rows after dropping nulls: {len(df)}")
else:
    print("      No missing values found. Data is clean.")

print("\n      Dataset summary:")
print(df.describe().to_string())


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — DEFINE FEATURES AND TARGET
# ─────────────────────────────────────────────────────────────────────────────

print("\n[3/6] Preparing features and target ...")

# Features (X) — all columns EXCEPT price
FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

# Target (y) — the column we want to predict
TARGET_COLUMN = "price"

X = df[FEATURE_COLUMNS]
y = df[TARGET_COLUMN]

print(f"      Feature columns : {FEATURE_COLUMNS}")
print(f"      Target column   : {TARGET_COLUMN}")
print(f"      X shape         : {X.shape}")
print(f"      y shape         : {y.shape}")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — TRAIN / TEST SPLIT
# ─────────────────────────────────────────────────────────────────────────────

print("\n[4/6] Splitting data into train and test sets ...")

# 80% training, 20% testing
# random_state=42 ensures same split every time (reproducibility)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"      Training samples  : {len(X_train)}")
print(f"      Test samples      : {len(X_test)}")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — TRAIN THE MODEL
# ─────────────────────────────────────────────────────────────────────────────

print("\n[5/6] Training Linear Regression model ...")

model = LinearRegression()
model.fit(X_train, y_train)

print("      Model trained successfully.")

# Show feature importance (coefficients)
print("\n      Feature coefficients (how much each feature affects price):")
for feature, coef in zip(FEATURE_COLUMNS, model.coef_):
    print(f"        {feature:<30} {coef:>12.4f}")
print(f"        {'intercept':<30} {model.intercept_:>12.4f}")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — EVALUATE THE MODEL
# ─────────────────────────────────────────────────────────────────────────────

print("\n[6/6] Evaluating model on test set ...")

y_pred = model.predict(X_test)

r2   = r2_score(y_test, y_pred)
mae  = mean_absolute_error(y_test, y_pred)
mse  = mean_squared_error(y_test, y_pred)
rmse = float(np.sqrt(mse))

print(f"\n      R² Score  : {r2:.4f}  (1.0 = perfect, >0.85 = good)")
print(f"      MAE       : ${mae:,.2f}  (average prediction error)")
print(f"      RMSE      : ${rmse:,.2f} (penalises large errors more)")


# ─────────────────────────────────────────────────────────────────────────────
# SAVE MODEL
# ─────────────────────────────────────────────────────────────────────────────

joblib.dump(model, MODEL_PATH)
print(f"\n      Model saved → {MODEL_PATH}")


# ─────────────────────────────────────────────────────────────────────────────
# SAVE METRICS
# ─────────────────────────────────────────────────────────────────────────────

metrics = {
    "model_type"       : "Linear Regression",
    "feature_columns"  : FEATURE_COLUMNS,
    "target_column"    : TARGET_COLUMN,
    "training_samples" : int(len(X_train)),
    "test_samples"     : int(len(X_test)),
    "r2_score"         : round(r2, 4),
    "mae"              : round(mae, 2),
    "mse"              : round(mse, 2),
    "rmse"             : round(rmse, 2),
}

with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=4)

print(f"      Metrics saved → {METRICS_PATH}")

print("\n" + "=" * 60)
print("  Training complete! You can now start the API.")
print("  Run: uvicorn app.main:app --reload --port 8000")
print("=" * 60 + "\n")
