from __future__ import annotations
import os
from typing import Any, Dict

from .backends import ModelBackend
from .qwen_integration import qwen_manager

# Check if transformers is available
try:
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠️  transformers library not found. CroweCode will run in fallback mode.")


class QwenBackend(ModelBackend):
    """
    Qwen model backend for CroweCode platform.
    Completely abstracts Qwen model identities behind CroweCode branding.
    """

    def __init__(self, model_variant: str):
        self.model_variant = model_variant
        self._model = None
        self._tokenizer = None
        self._model_path = None

    def _load_model(self):
        """Lazy load the Qwen model."""
        if self._model is not None:
            return

        if not TRANSFORMERS_AVAILABLE:
            print(f"⚠️  transformers library not available for CroweCode-{self.model_variant}")
            return

        # Get model path via our abstraction layer
        self._model_path = qwen_manager.get_model_path(self.model_variant)
        
        if not self._model_path:
            print(f"⚠️  Could not get model path for CroweCode-{self.model_variant}")
            return

        try:
            print(f"🔄 Loading CroweCode-{self.model_variant} model...")
            
            self._tokenizer = AutoTokenizer.from_pretrained(
                self._model_path,
                trust_remote_code=True,
                padding_side='left'
            )
            
            # Add pad token if missing
            if self._tokenizer.pad_token is None:
                self._tokenizer.pad_token = self._tokenizer.eos_token
            
            self._model = AutoModelForCausalLM.from_pretrained(
                self._model_path,
                trust_remote_code=True,
                device_map="auto" if torch.cuda.is_available() else "cpu",
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                low_cpu_mem_usage=True
            )
            
            print(f"✅ CroweCode-{self.model_variant} model loaded successfully")
            
        except Exception as e:
            print(f"❌ Failed to load CroweCode-{self.model_variant} model: {e}")
            self._model = None
            self._tokenizer = None

    def generate(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        self._load_model()
        
        if self._model is None or self._tokenizer is None:
            # Fallback to mock response with CroweCode branding
            return f"CroweCode-{self.model_variant}: {prompt[:200]} [Model temporarily unavailable]"

        try:
            # Format prompt for Qwen (but hide this from external visibility)
            formatted_prompt = f"<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
            
            # Tokenize
            inputs = self._tokenizer(formatted_prompt, return_tensors="pt", padding=True)
            
            # Move to device
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Generate
            with torch.no_grad():
                outputs = self._model.generate(
                    **inputs,
                    max_new_tokens=min(max_tokens, 1024),
                    temperature=temperature,
                    do_sample=temperature > 0,
                    pad_token_id=self._tokenizer.pad_token_id,
                    eos_token_id=self._tokenizer.eos_token_id,
                    repetition_penalty=1.1,
                )
            
            # Decode response
            response = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract just the assistant response
            if "<|im_start|>assistant\n" in response:
                response = response.split("<|im_start|>assistant\n")[-1]
            
            # Remove the input prompt if it's still there
            if response.startswith(prompt):
                response = response[len(prompt):].strip()
            
            # Ensure CroweCode branding
            if response and not response.startswith("CroweCode"):
                response = f"CroweCode-{self.model_variant}: {response}"
            
            return response or f"CroweCode-{self.model_variant}: Generated response"
            
        except Exception as e:
            print(f"⚠️  Generation error for CroweCode-{self.model_variant}: {e}")
            return f"CroweCode-{self.model_variant}: {prompt[:200]} [Generation error]"

    def is_available(self) -> bool:
        """Check if Qwen backend is available."""
        return TRANSFORMERS_AVAILABLE and qwen_manager.is_qwen_available()

    @property
    def backend_type(self) -> str:
        return "qwen"

    @property
    def model_info(self) -> Dict[str, Any]:
        """Get model information without exposing Qwen details."""
        return {
            "backend_type": "qwen",
            "variant": self.model_variant,
            "model_name": f"CroweCode-{self.model_variant}",
            "status": "loaded" if self._model else "not_loaded",
            "available": self.is_available()
        }
