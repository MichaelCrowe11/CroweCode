from __future__ import annotations
import os
import json
import base64
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from functools import lru_cache

from .qwen_integration import qwen_manager
try:
    from .qwen_backend import QwenBackend
    QWEN_AVAILABLE = True
except ImportError:
    QWEN_AVAILABLE = False
    QwenBackend = None


class ModelBackend(ABC):
    """
    Abstract backend for CroweCode models.
    All backends must implement this interface to be used by CroweCode models.
    """

    @abstractmethod
    def generate(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """Generate text response for the given prompt."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this backend is available and ready."""
        pass

    @property
    @abstractmethod
    def backend_type(self) -> str:
        """Return backend type identifier."""
        pass


class MockBackend(ModelBackend):
    """
    Mock backend for testing and development.
    Returns deterministic responses for consistent testing.
    """

    def __init__(self, model_variant: str):
        self.model_variant = model_variant

    def generate(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        # Simulate realistic response based on model type
        responses = {
            "Alpha": f"CroweCode-Alpha provides intelligent analysis: {prompt[:min(200, max_tokens)]}",
            "Beta": f"// CroweCode-Beta generated code\nfunction response() {{\n  return '{prompt[:100]}';\n}}",
            "Gamma": f"CroweCode-Gamma creates: Once upon a time, {prompt[:150]}...",
            "Delta": f"CroweCode-Delta analysis shows: {prompt[:180]} [Analysis complete]",
            "Epsilon": f"CroweCode-Epsilon: Hello! I understand you're asking about: {prompt[:120]}",
            "Zeta": f"CroweCode-Zeta translation: {prompt[:100]} → [Translated content]",
            "Eta": f"CroweCode-Eta research: {prompt[:140]} [Sources: CroweCode Knowledge Base]",
            "Theta": f"CroweCode-Theta vision: I can see {prompt[:110]} [Multimodal analysis]"
        }
        return responses.get(self.model_variant, f"CroweCode-{self.model_variant}: {prompt[:100]}")

    def is_available(self) -> bool:
        return True

    @property
    def backend_type(self) -> str:
        return "mock"


class TransformersBackend(ModelBackend):
    """
    HuggingFace Transformers backend.
    Completely abstracted - only CroweCode names are exposed.
    """

    def __init__(self, model_variant: str):
        self.model_variant = model_variant
        self._model = None
        self._tokenizer = None
        self._model_config = self._get_model_config()

    @lru_cache(maxsize=1)
    def _get_model_config(self) -> Dict[str, str]:
        """
        Get internal model mapping from environment.
        Supports tiered configuration for different deployment scenarios.
        """
        # Check for custom mapping first
        mapping_b64 = os.getenv("CROWECODE_MODEL_MAPPING_B64", "")
        if mapping_b64:
            try:
                decoded = base64.b64decode(mapping_b64.encode("utf-8"))
                return json.loads(decoded.decode("utf-8"))
            except Exception:
                pass
        
        # Use tier-based configuration
        tier = os.getenv("CROWECODE_MODEL_TIER", "development").lower()
        
        if tier == "production":
            # High-performance models for production
            return {
                "Alpha": "microsoft/DialoGPT-medium",  # General reasoning
                "Beta": "Salesforce/codet5-small",    # Code generation
                "Gamma": "gpt2",                      # Creative writing
                "Delta": "google/flan-t5-small",     # Analysis
                "Epsilon": "microsoft/DialoGPT-small", # Conversation
                "Zeta": "Helsinki-NLP/opus-mt-en-es", # Translation
                "Eta": "google/flan-t5-base",        # Research
                "Theta": "microsoft/DialoGPT-small"   # Multimodal placeholder
            }
        elif tier == "medium":
            # Balanced performance/size models
            return {
                "Alpha": "distilgpt2",
                "Beta": "microsoft/CodeGPT-small-java",
                "Gamma": "distilgpt2", 
                "Delta": "google/flan-t5-small",
                "Epsilon": "microsoft/DialoGPT-small",
                "Zeta": "Helsinki-NLP/opus-mt-en-es",
                "Eta": "google/flan-t5-small",
                "Theta": "microsoft/DialoGPT-small"
            }
        else:  # development or default
            # Lightweight models for development/testing
            return {
                "Alpha": "microsoft/DialoGPT-small",
                "Beta": "microsoft/DialoGPT-small", 
                "Gamma": "microsoft/DialoGPT-small",
                "Delta": "microsoft/DialoGPT-small",
                "Epsilon": "microsoft/DialoGPT-small",
                "Zeta": "microsoft/DialoGPT-small",
                "Eta": "microsoft/DialoGPT-small",
                "Theta": "microsoft/DialoGPT-small"
            }

    def _load_model(self):
        """Lazy load the actual model."""
        if self._model is not None:
            return

        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            import torch
            
            model_name = self._model_config.get(self.model_variant, "microsoft/DialoGPT-small")
            
            self._tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                padding_side='left'
            )
            
            # Add pad token if missing
            if self._tokenizer.pad_token is None:
                self._tokenizer.pad_token = self._tokenizer.eos_token
            
            self._model = AutoModelForCausalLM.from_pretrained(
                model_name,
                device_map="auto" if os.getenv("CUDA_VISIBLE_DEVICES") else "cpu",
                torch_dtype="auto"
            )
            
        except ImportError as e:
            print(f"⚠️  Transformers or torch not available: {e}")
            self._model = None
            self._tokenizer = None
        except Exception as e:
            print(f"⚠️  Could not load transformers model: {e}")
            self._model = None
            self._tokenizer = None

    def generate(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        try:
            self._load_model()
        except Exception as e:
            print(f"⚠️  Model loading failed: {e}")
            self._model = None
            self._tokenizer = None
        
        if self._model is None or self._tokenizer is None:
            # Fallback to mock if model loading failed
            mock = MockBackend(self.model_variant)
            return mock.generate(prompt, max_tokens, temperature, **kwargs)

        try:
            import torch
            # Tokenize input
            inputs = self._tokenizer.encode(prompt, return_tensors="pt")
            
            # Generate with the model
            with torch.no_grad():
                outputs = self._model.generate(
                    inputs,
                    max_new_tokens=min(max_tokens, 512),  # Reasonable limit
                    temperature=temperature,
                    do_sample=temperature > 0,
                    pad_token_id=self._tokenizer.pad_token_id,
                    eos_token_id=self._tokenizer.eos_token_id,
                )
            
            # Decode response
            response = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Remove the input prompt from response
            if response.startswith(prompt):
                response = response[len(prompt):].strip()
            
            return response or f"CroweCode-{self.model_variant} generated response"
            
        except Exception as e:
            print(f"⚠️  Generation error: {e}")
            # Fallback to mock
            mock = MockBackend(self.model_variant)
            return mock.generate(prompt, max_tokens, temperature, **kwargs)

    def is_available(self) -> bool:
        try:
            import transformers
            import torch
            return True
        except ImportError:
            return False

    @property
    def backend_type(self) -> str:
        return "transformers"


class BackendFactory:
    """
    Factory for creating model backends.
    Automatically selects the best available backend.
    """

    @staticmethod
    def create_backend(model_variant: str) -> ModelBackend:
        """Create the best available backend for the model variant."""
        
        # Check environment preference
        backend_type = os.getenv("CROWECODE_BACKEND", "auto").lower()
        
        if backend_type == "mock":
            return MockBackend(model_variant)
        
        # Try Qwen backend first (highest priority)
        if backend_type in ("qwen", "auto") and QWEN_AVAILABLE:
            qwen_backend = QwenBackend(model_variant)
            if qwen_backend.is_available():
                return qwen_backend
        
        # Try Transformers backend
        if backend_type in ("transformers", "auto"):
            transformers_backend = TransformersBackend(model_variant)
            if transformers_backend.is_available():
                return transformers_backend
        
        # Fallback to mock
        print(f"ℹ️  Using mock backend for CroweCode-{model_variant}")
        return MockBackend(model_variant)
