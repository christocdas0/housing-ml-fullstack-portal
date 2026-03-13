"""
app/model_loader.py
===================
Responsible for loading the trained ML model and metrics into memory.

Key concept — Singleton pattern:
  We load the model ONCE when the API starts up (not on every request).
  This makes predictions fast because we never re-read the file from disk.

Usage (in routes):
    from app.model_loader import get_model, get_metrics

Author : Christo
"""

import os
import json
import joblib
import logging

from sklearn.linear_model import LinearRegression

# Logger for this module
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

# This file lives at:  model-service/app/model_loader.py
# model.pkl lives at:  model-service/model.pkl
#  → Go one level up from app/ to reach model-service/
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH   = os.path.join(BASE_DIR, "model.pkl")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")


# ─────────────────────────────────────────────────────────────────────────────
# SINGLETON STORAGE
# ─────────────────────────────────────────────────────────────────────────────

# These variables are module-level — they persist for the lifetime of the process.
# Once loaded, they are reused for every API request.
_model: LinearRegression | None = None
_metrics: dict | None = None


# ─────────────────────────────────────────────────────────────────────────────
# LOAD FUNCTIONS  (called once at startup)
# ─────────────────────────────────────────────────────────────────────────────

def load_model() -> None:
    """
    Load the trained model from model.pkl into memory.
    Called during FastAPI startup event.
    Raises FileNotFoundError if model.pkl does not exist.
    """
    global _model

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"model.pkl not found at: {MODEL_PATH}\n"
            "Please run 'python train_model.py' first to train and save the model."
        )

    logger.info(f"Loading model from: {MODEL_PATH}")
    _model = joblib.load(MODEL_PATH)
    logger.info("Model loaded successfully.")


def load_metrics() -> None:
    """
    Load the metrics JSON into memory.
    Called during FastAPI startup event.
    Raises FileNotFoundError if metrics.json does not exist.
    """
    global _metrics

    if not os.path.exists(METRICS_PATH):
        raise FileNotFoundError(
            f"metrics.json not found at: {METRICS_PATH}\n"
            "Please run 'python train_model.py' first."
        )

    logger.info(f"Loading metrics from: {METRICS_PATH}")
    with open(METRICS_PATH, "r") as f:
        _metrics = json.load(f)
    logger.info(f"Metrics loaded: {_metrics}")


# ─────────────────────────────────────────────────────────────────────────────
# GETTER FUNCTIONS  (used by route handlers)
# ─────────────────────────────────────────────────────────────────────────────

def get_model() -> LinearRegression:
    """
    Return the loaded model.
    Raises RuntimeError if load_model() was never called.
    """
    if _model is None:
        raise RuntimeError(
            "Model is not loaded. The API startup event may have failed."
        )
    return _model


def get_metrics() -> dict:
    """
    Return the loaded metrics dictionary.
    Raises RuntimeError if load_metrics() was never called.
    """
    if _metrics is None:
        raise RuntimeError(
            "Metrics are not loaded. The API startup event may have failed."
        )
    return _metrics


def is_model_loaded() -> bool:
    """Return True if the model is currently loaded in memory."""
    return _model is not None
