from __future__ import annotations
from typing import Any, Dict

from .registry import ModelRegistry
from .formatting import ResponseFormatter


class CroweCodeEngine:
    """CroweCode proprietary intelligence engine wrapper."""

    def __init__(self) -> None:
        self._registry = ModelRegistry()
        self._models: Dict[str, Any] = {}
        self._load_crowecode_models()

    def _load_crowecode_models(self) -> None:
        for name in self._registry.list_models().keys():
            self._models[name] = self._registry.get(name)

    def process_request(
        self, 
        request: Any, 
        model: str = "CroweCode-Alpha",
        max_tokens: int = 1024,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        if model not in self._models:
            raise KeyError(f"Unknown CroweCode model: {model}")
        
        # Pass generation parameters to model
        content = self._models[model].generate(request, max_tokens=max_tokens, temperature=temperature)
        
        metadata = {
            "version": "CroweCode v2.0",
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        
        return ResponseFormatter.brand_response(model=model, content=content, metadata=metadata)
