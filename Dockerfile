# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.11
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UVICORN_WORKERS=1 \
    PORT=8000 \
    HOST=0.0.0.0

# System deps (minimal; extend as needed)
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirement files first for better build caching
COPY requirements.server.txt /app/requirements.server.txt
COPY requirements-ml.txt /app/requirements-ml.txt

ARG INSTALL_ML=false
RUN set -eux; \
    if [ -f /app/requirements.server.txt ]; then \
        pip install -r /app/requirements.server.txt; \
    else \
        pip install -r /app/requirements.txt; \
    fi; \
    if [ "$INSTALL_ML" = "true" ] && [ -f /app/requirements-ml.txt ]; then \
        pip install -r /app/requirements-ml.txt; \
    fi

# Copy app code
COPY . /app

# Install project in editable mode (package: crowecode)
RUN pip install -e .

# Ensure entrypoint script is executable
RUN chmod +x /app/start.sh

EXPOSE 8000

# Default command uses the start script (allows overrides via env)
CMD ["/bin/sh", "/app/start.sh"]
