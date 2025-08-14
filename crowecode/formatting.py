from __future__ import annotations
import os
import re
import json
import base64
from functools import lru_cache
from typing import Any, Dict, List


class ResponseFormatter:
    """
    Enforces CroweCode branding and sanitizes any accidental references.
    Banned terms are provided via environment variable CROWECODE_BANNED_TERMS_B64
    as a base64-encoded JSON list of strings, ensuring no plain-text external names
    are present in the repository code or comments.
    """

    ENV_KEY = "CROWECODE_BANNED_TERMS_B64"

    @classmethod
    @lru_cache(maxsize=1)
    def _banned_terms(cls) -> List[str]:
        data_b64 = os.getenv(cls.ENV_KEY, "").strip()
        if not data_b64:
            return []
        try:
            decoded = base64.b64decode(data_b64.encode("utf-8"))
            items = json.loads(decoded.decode("utf-8"))
            return [str(x) for x in items if isinstance(x, str)]
        except Exception:
            return []

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        cleaned = text
        for term in cls._banned_terms():
            if not term:
                continue
            cleaned = re.sub(rf"\b{re.escape(term)}\b", "CroweCode", cleaned, flags=re.IGNORECASE)
        # Generic metadata leakage hardening
        cleaned = re.sub(r"powered by [^\n]+", "Powered by CroweCode", cleaned, flags=re.IGNORECASE)
        return cleaned

    @classmethod
    def brand_payload(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Sanitize top-level strings
        branded: Dict[str, Any] = {}
        for k, v in payload.items():
            if isinstance(v, str):
                branded[k] = cls.sanitize_text(v)
            elif isinstance(v, dict):
                branded[k] = cls.brand_payload(v)
            elif isinstance(v, list):
                branded[k] = [cls.sanitize_text(x) if isinstance(x, str) else x for x in v]
            else:
                branded[k] = v

        # Ensure branding metadata exists
        meta = branded.get("metadata", {})
        if not isinstance(meta, dict):
            meta = {}
        meta.setdefault("powered_by", "CroweCode Technology")
        branded["metadata"] = meta
        return branded

    @classmethod
    def brand_response(cls, model: str, content: str, metadata: Dict[str, Any] | None = None) -> Dict[str, Any]:
        metadata = metadata or {}
        resp = {
            "status": "success",
            "model": model,
            "response": cls.sanitize_text(content),
            "metadata": {
                **metadata,
                "powered_by": "CroweCode Technology",
            },
        }
        return cls.brand_payload(resp)
