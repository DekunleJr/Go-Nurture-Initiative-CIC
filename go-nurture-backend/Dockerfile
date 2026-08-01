# Go Nurture Backend - Dockerfile for Render deployment
# NOTE: If python:3.14.2-slim is not yet available on Docker Hub,
# fall back to python:3.14-slim or python:3.13-slim
FROM python:3.14.2-slim

# Set working directory
WORKDIR /app

# Set environment variables to prevent Python from writing .pyc files
# and to ensure output is not buffered (logs appear immediately)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for psycopg2-binary and build tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Run Alembic migrations, then start Uvicorn
# Render injects the PORT environment variable at runtime.
# No hardcoded port — $PORT must be set by the runtime environment.
CMD alembic upgrade head \
    && uvicorn app.main:app --host 0.0.0.0 --port $PORT
