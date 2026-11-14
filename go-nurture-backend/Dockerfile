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

# start.sh applies all pending Alembic migrations (an empty database gets the
# full schema), then starts Uvicorn. If a migration fails the container exits,
# so the API never runs against a half-migrated schema.
# Render injects PORT at runtime; start.sh defaults to 8000 for local runs.
CMD ["sh", "/app/start.sh"]
