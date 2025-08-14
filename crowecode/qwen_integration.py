from __future__ import annotations
import os
import json
import base64
from typing import Dict, Optional
from functools import lru_cache


class QwenModelManager:
    """
    Manages Qwen model downloads and paths for CroweCode platform.
    Supports both local downloads and cloud storage integration.
    Completely abstracts Qwen model names from external visibility.
    """

    def __init__(self):
        self._model_cache = {}
        self._download_cache = {}
        self._cloud_manager = None

    def _get_cloud_manager(self):
        """Get cloud manager if available."""
        if self._cloud_manager is None:
            try:
                from crowecode.cloud_storage import get_cloud_manager
                self._cloud_manager = get_cloud_manager()
            except ImportError:
                pass
        return self._cloud_manager

    @lru_cache(maxsize=1)
    def _get_qwen_mapping(self) -> Dict[str, str]:
        """
        Get CroweCode to Qwen model mapping from environment.
        Format: CROWECODE_QWEN_MAPPING_B64=base64(json)
        """
        mapping_b64 = os.getenv("CROWECODE_QWEN_MAPPING_B64", "")
        if mapping_b64:
            try:
                decoded = base64.b64decode(mapping_b64.encode("utf-8"))
                return json.loads(decoded.decode("utf-8"))
            except Exception:
                pass

        # Default mapping (can be customized via environment)
        # Based on actual Qwen3-Coder models available via kagglehub
        return {
            "Alpha": "qwen-lm/qwen3-coder/transformers/7b-a14b-instruct",
            "Beta": "qwen-lm/qwen3-coder/transformers/30b-a3b-instruct", 
            "Gamma": "qwen-lm/qwen3-coder/transformers/480b-a35b-instruct",
            "Delta": "qwen-lm/qwen3-coder/transformers/7b-a14b-instruct",
            "Epsilon": "qwen-lm/qwen3-coder/transformers/30b-a3b-instruct",
            "Zeta": "qwen-lm/qwen3-coder/transformers/7b-a14b-instruct",
            "Eta": "qwen-lm/qwen3-coder/transformers/30b-a3b-instruct",
            "Theta": "qwen-lm/qwen3-coder/transformers/480b-a35b-instruct"
        }

    def _get_kagglehub(self):
        """Get kagglehub module if available."""
        try:
            import kagglehub
            return kagglehub
        except ImportError:
            return None

    def is_available(self) -> bool:
        """Check if Qwen models can be downloaded."""
        kagglehub = self._get_kagglehub()
        return kagglehub is not None

    def list_models(self) -> list[str]:
        """List all CroweCode model names."""
        mapping = self._get_qwen_mapping()
        return [f"crowecode-{variant.lower()}" for variant in mapping.keys()]

    def download_model(self, crowecode_variant: str) -> Optional[str]:
        """
        Download model for CroweCode variant and return local path.
        First checks cloud storage, then downloads from Kaggle if needed.
        Returns None if download fails.
        """
        # Normalize variant (accept case-insensitive and optional prefixes)
        variant_input = (crowecode_variant or "").strip()
        if variant_input.lower().startswith("crowecode-"):
            variant_input = variant_input.split("-", 1)[1]
        normalized_variant = variant_input[:1].upper() + variant_input[1:].lower()

        if normalized_variant in self._download_cache:
            return self._download_cache[normalized_variant]

        # Try cloud storage first
        cloud_manager = self._get_cloud_manager()
        if cloud_manager:
            cloud_path = cloud_manager.download_model_from_cloud(normalized_variant)
            if cloud_path:
                self._download_cache[normalized_variant] = cloud_path
                return cloud_path

        # Fall back to direct download
        mapping = self._get_qwen_mapping()
        qwen_model_id = mapping.get(normalized_variant)
        
        if not qwen_model_id:
            print(f"⚠️  No Qwen model configured for CroweCode-{normalized_variant}")
            return None

        try:
            kagglehub = self._get_kagglehub()
            if not kagglehub:
                print(f"❌ Kagglehub not available for CroweCode-{crowecode_variant}")
                return None
            
            print(f"📥 Downloading model for CroweCode-{normalized_variant}...")
            model_path = kagglehub.model_download(qwen_model_id)
            
            # Upload to cloud storage if available
            if cloud_manager:
                print(f"☁️  Uploading CroweCode-{normalized_variant} to cloud storage...")
                cloud_manager.upload_model_to_cloud(normalized_variant, model_path)
            
            self._download_cache[normalized_variant] = model_path
            print(f"✅ CroweCode-{normalized_variant} model ready at: {model_path}")
            
            return model_path
            
        except Exception as e:
            print(f"❌ Failed to download model for CroweCode-{normalized_variant}: {e}")
            return None

    def get_model_path(self, crowecode_variant: str) -> Optional[str]:
        """Get local path for CroweCode variant model (download if needed)."""
        return self.download_model(crowecode_variant)

    def is_qwen_available(self) -> bool:
        """Check if Qwen models can be downloaded."""
        return self._get_kagglehub() is not None

    def list_available_models(self) -> Dict[str, str]:
        """List all CroweCode variants and their model status."""
        mapping = self._get_qwen_mapping()
        status = {}
        
        for variant, qwen_id in mapping.items():
            if variant in self._download_cache:
                status[f"CroweCode-{variant}"] = "downloaded"
            else:
                status[f"CroweCode-{variant}"] = "available"
        
        return status


# Global instance
qwen_manager = QwenModelManager()
