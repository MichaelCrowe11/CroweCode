from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict

from .backends import BackendFactory


class CroweCodeModel(ABC):
    """
    Base interface for all CroweCode models.
    No external underlying technologies are referenced anywhere.
    """

    variant: str = ""

    def __init__(self):
        # Use backend factory to get the best available backend
        self._backend = BackendFactory.create_backend(self.variant)

    @property
    def model_name(self) -> str:
        return f"CroweCode-{self.variant}"

    def generate(self, request: Any, max_tokens: int = 1024, temperature: float = 0.7) -> str:
        """Generate a string response for the given request."""
        prompt = request if isinstance(request, str) else str(request)
        
        # Use the backend to generate the response
        response = self._backend.generate(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        # Ensure response is properly attributed to CroweCode
        if not response.startswith("CroweCode"):
            response = f"CroweCode-{self.variant}: {response}"
        
        return response

    @property
    def backend_info(self) -> Dict[str, Any]:
        """Get backend information (for debugging/monitoring)."""
        return {
            "backend_type": self._backend.backend_type,
            "available": self._backend.is_available(),
            "model_name": self.model_name
        }


class CroweCodeAlpha(CroweCodeModel):
    variant = "Alpha"


class CroweCodeBeta(CroweCodeModel):
    variant = "Beta"


class CroweCodeGamma(CroweCodeModel):
    variant = "Gamma"


class CroweCodeDelta(CroweCodeModel):
    variant = "Delta"


class CroweCodeEpsilon(CroweCodeModel):
    variant = "Epsilon"


class CroweCodeZeta(CroweCodeModel):
    variant = "Zeta"


class CroweCodeEta(CroweCodeModel):
    variant = "Eta"


class CroweCodeTheta(CroweCodeModel):
    variant = "Theta"
