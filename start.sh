#!/usr/bin/env sh
set -e

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}
WORKERS=${UVICORN_WORKERS:-1}
LOG_LEVEL=${LOG_LEVEL:-info}

# Default app module: use packaged app by default
APP_MODULE=${APP_MODULE:-crowecode.api:app}

exec uvicorn "$APP_MODULE" --host "$HOST" --port "$PORT" --workers "$WORKERS" --log-level "$LOG_LEVEL"
