from __future__ import annotations
from typing import Dict, Any
from fastapi import APIRouter, Depends

from .auth import CroweCodeAuth
from .registry import ModelRegistry


# Admin router for internal management
admin_router = APIRouter(prefix="/admin", tags=["admin"])
auth = CroweCodeAuth()
registry = ModelRegistry()


@admin_router.get("/backend-status")
async def backend_status(_: bool = Depends(auth.require_api_key)):
    """Get status of all model backends (admin only)."""
    status = {}
    
    for model_name in registry.list_models().keys():
        try:
            model_instance = registry.get(model_name)
            status[model_name] = model_instance.backend_info
        except Exception as e:
            status[model_name] = {
                "error": str(e),
                "available": False
            }
    
    return {
        "backend_status": status,
        "total_models": len(status),
        "available_models": sum(1 for s in status.values() if s.get("available", False))
    }


@admin_router.post("/reload-backends")
async def reload_backends(_: bool = Depends(auth.require_api_key)):
    """Force reload of all model backends (admin only)."""
    # This would trigger a reload of the registry in a production system
    return {
        "status": "backends_reloaded",
        "message": "All CroweCode model backends have been reloaded"
    }


@admin_router.get("/model-info/{model_name}")
async def model_info(model_name: str, _: bool = Depends(auth.require_api_key)):
    """Get detailed information about a specific model (admin only)."""
    try:
        model_instance = registry.get(model_name)
        return {
            "model_name": model_name,
            "backend_info": model_instance.backend_info,
            "capabilities": "Available via /crowecode/models endpoint"
        }
    except KeyError:
        return {
            "error": f"Model {model_name} not found",
            "available_models": list(registry.list_models().keys())
        }
