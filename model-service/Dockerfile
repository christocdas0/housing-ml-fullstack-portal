# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — Housing ML Model Service
# ──────────────────────────────────────────────────────────────────────────────
#
# What this file does:
#   Builds a Docker image that:
#     1. Starts from Python 3.12 (official image)
#     2. Installs dependencies from requirements.txt
#     3. Copies the source code into the container
#     4. Runs train_model.py to train and save the model
#     5. Starts the FastAPI server with uvicorn
#
# How to build and run:
#   docker build -t housing-model-api .
#   docker run -p 8000:8000 housing-model-api
#
# Then open: http://localhost:8000/docs
# ──────────────────────────────────────────────────────────────────────────────

# Base image — official Python 3.12 slim (smaller image size)
FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# ── Install curl (needed for Docker health check) ────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# ── Install dependencies first (Docker caches this layer) ──────────────────
# Copying requirements.txt before the rest of the code means Docker
# only re-installs packages when requirements.txt changes, not on every build.
COPY model-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy datasets ────────────────────────────────────────────────────────────
COPY datasets ./datasets

# ── Copy source code ─────────────────────────────────────────────────────────
COPY model-service/ .

# ── Train the model (creates model.pkl and metrics.json) ─────────────────────
RUN python train_model.py

# ── Expose port ──────────────────────────────────────────────────────────────
EXPOSE 8000

# ── Start the API ────────────────────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
