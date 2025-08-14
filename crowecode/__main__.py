#!/usr/bin/env python3
"""
CLI entry point for CroweCode API server.
Usage: python -m crowecode [--host HOST] [--port PORT]
"""
import argparse
import uvicorn
from .api import app


def main():
    parser = argparse.ArgumentParser(description="CroweCode API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    
    args = parser.parse_args()
    
    print(f"Starting CroweCode API server on {args.host}:{args.port}")
    uvicorn.run(
        "crowecode.api:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()
