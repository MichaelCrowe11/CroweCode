from __future__ import annotations

"""
Crowe Logic Agent Registry
==========================

Purpose:
- Central place to register and retrieve AI agent profiles (names, divisions, expertise)
- Loads from a YAML file (configs/agents.yaml) when available
- Provides simple list/search/get helpers for API and CLI usage

Usage:
    from crowecode.registry import AgentRegistry
    agents = AgentRegistry.list_agents(division_filter="executive")
    marcus = AgentRegistry.find_by_name("Marcus Chen Wei")

If no YAML exists, the registry starts empty. Use AgentRegistry.bootstrap_yaml()
to generate a starter file you can populate (paste the full roster).
"""

from dataclasses import dataclass, asdict
from enum import Enum
from typing import List, Dict, Optional, Any
import os
import yaml
from urllib.parse import urlparse
import time
import hashlib


CONFIGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "configs"))
DEFAULT_YAML = os.path.join(CONFIGS_DIR, "agents.yaml")


class Division(str, Enum):
    EXECUTIVE = "executive"
    FINANCIAL = "financial"
    TECHNICAL = "technical"
    HEALTHCARE = "healthcare"
    MARKETING = "marketing"
    OPERATIONS = "operations"
    HR = "hr"
    LEGAL = "legal"
    SALES = "sales"
    RESEARCH = "research"
    EDUCATION = "education"
    SUSTAINABILITY = "sustainability"
    COMMUNICATIONS = "communications"


@dataclass
class AgentProfile:
    id: str
    name: str
    division: Division
    expertise: List[str] | None = None
    specialization: Optional[str] = None
    knowledge_base: Optional[str] = None
    status: str = "active"  # active | development | retired

    def public_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["division"] = self.division.value
        return d


class AgentRegistry:
    _by_id: Dict[str, AgentProfile] = {}
    _by_name: Dict[str, AgentProfile] = {}
    _loaded_path: Optional[str] = None
    _last_cloud_url: Optional[str] = None
    _last_loaded_at: Optional[float] = None
    _last_fingerprint: Optional[str] = None

    @classmethod
    def _download_agents_yaml_from_s3(cls, s3_url: str, dest_path: str) -> bool:
        """Download a YAML file from S3 to the given destination path.

        s3_url format: s3://<bucket>/<key>
        """
        try:
            parsed = urlparse(s3_url)
            if parsed.scheme != "s3" or not parsed.netloc or not parsed.path:
                return False

            bucket = parsed.netloc
            key = parsed.path.lstrip("/")

            # Lazy import boto3; only required when this feature is used
            import boto3  # type: ignore

            s3 = boto3.client("s3")
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, "wb") as f:
                s3.download_fileobj(bucket, key, f)
            return True
        except Exception:
            # Swallow to avoid impacting startup; users can check logs
            return False

    @classmethod
    def load_from_cloud_if_configured(cls) -> Optional[str]:
        """If an S3 URL is provided via env, download agents.yaml locally.

        Env vars:
          - CROWECODE_AGENTS_S3_URL=s3://bucket/path/agents.yaml (primary)
          - CROWECODE_AGENTS_S3_URL_BACKUP=s3://backup-bucket/path/agents.yaml (secondary)
          - CROWECODE_AGENTS_S3_URLS=comma,separated,list (tries in order)

        Returns the local path if fetched, else None.
        """
        urls: list[str] = []
        # Prefer explicit list if provided
        urls_env = os.getenv("CROWECODE_AGENTS_S3_URLS")
        if urls_env:
            urls = [u.strip() for u in urls_env.split(",") if u.strip()]

        # Fallback to single primary + optional backup
        primary = os.getenv("CROWECODE_AGENTS_S3_URL")
        backup = os.getenv("CROWECODE_AGENTS_S3_URL_BACKUP")
        if not urls:
            if primary:
                urls.append(primary)
            if backup:
                urls.append(backup)

        if not urls:
            return None

        dest_path = DEFAULT_YAML
        for url in urls:
            if cls._download_agents_yaml_from_s3(url, dest_path):
                # Record which cloud path we used
                cls._loaded_path = dest_path
                cls._last_cloud_url = url
                return dest_path
        return None

    @classmethod
    def load_from_yaml(cls, path: Optional[str] = None) -> int:
        """Load agents from a YAML file. Returns count loaded."""
        yaml_path = path or DEFAULT_YAML
        if not os.path.exists(yaml_path):
            return 0

        with open(yaml_path, "r", encoding="utf-8") as f:
            raw = f.read()
            data = yaml.safe_load(raw) or {}

        agents = data.get("agents") or data  # support flat list or keyed
        if isinstance(agents, dict):
            agents = list(agents.values())

        loaded = 0
        for item in agents or []:
            try:
                profile = AgentProfile(
                    id=str(item["id"]).strip(),
                    name=str(item["name"]).strip(),
                    division=Division(str(item["division"]).strip().lower()),
                    expertise=item.get("expertise") or [],
                    specialization=item.get("specialization"),
                    knowledge_base=item.get("knowledge_base"),
                    status=item.get("status", "active"),
                )
                cls._register(profile)
                loaded += 1
            except Exception:
                # Skip invalid entries; could add logging here
                continue

        cls._loaded_path = yaml_path
        # Record metadata
        cls._last_loaded_at = time.time()
        try:
            cls._last_fingerprint = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        except Exception:
            cls._last_fingerprint = None
        return loaded

    @classmethod
    def refresh_if_stale(cls, ttl_seconds: Optional[int] = None) -> None:
        """Refresh from cloud/YAML if cache is stale based on TTL.

        ttl_seconds can be provided, or defaults from env CROWECODE_AGENTS_CACHE_TTL_SECS (default 300).
        """
        if ttl_seconds is None:
            try:
                ttl_seconds = int(os.getenv("CROWECODE_AGENTS_CACHE_TTL_SECS", "300"))
            except Exception:
                ttl_seconds = 300

        now = time.time()
        if not cls._last_loaded_at or (now - cls._last_loaded_at) >= max(0, ttl_seconds):
            # Try cloud, then YAML
            try:
                cls.load_from_cloud_if_configured()
            except Exception:
                pass
            try:
                cls.load_from_yaml()
            except Exception:
                pass

    @classmethod
    def status(cls) -> Dict[str, Any]:
        """Return registry load status for observability."""
        return {
            "loaded_path": cls._loaded_path,
            "last_cloud_url": cls._last_cloud_url,
            "last_loaded_at": cls._last_loaded_at,
            "fingerprint": cls._last_fingerprint,
            "count": len(cls._by_id),
        }

    @classmethod
    def bootstrap_yaml(cls, path: Optional[str] = None) -> str:
        """Create a starter YAML file with a few sample agents if missing."""
        yaml_path = path or DEFAULT_YAML
        os.makedirs(os.path.dirname(yaml_path), exist_ok=True)

        if os.path.exists(yaml_path):
            return yaml_path

        sample = {
            "agents": [
                {
                    "id": "CL-001",
                    "name": "Marcus Chen Wei",
                    "division": Division.EXECUTIVE.value,
                    "expertise": [
                        "operations_research",
                        "complex_systems_optimization",
                        "corporate_transformation",
                    ],
                    "specialization": "Multi-variable optimization and strategic planning",
                    "status": "active",
                },
                {
                    "id": "CL-011",
                    "name": "Victoria Pemberton",
                    "division": Division.FINANCIAL.value,
                    "expertise": [
                        "financial_engineering",
                        "quantitative_modeling",
                        "portfolio_theory",
                    ],
                    "specialization": "Complex financial instrument design",
                    "status": "active",
                },
                {
                    "id": "CL-023",
                    "name": "Raj Patel",
                    "division": Division.TECHNICAL.value,
                    "expertise": [
                        "machine_learning",
                        "neural_networks",
                        "deep_learning",
                    ],
                    "specialization": "AI system design and optimization",
                    "status": "active",
                },
            ]
        }

        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.safe_dump(sample, f, sort_keys=False, allow_unicode=True)

        # Load newly created
        cls.load_from_yaml(yaml_path)
        return yaml_path

    @classmethod
    def _register(cls, profile: AgentProfile) -> None:
        cls._by_id[profile.id] = profile
        cls._by_name[profile.name.lower()] = profile

    @classmethod
    def register(cls, profile: AgentProfile) -> None:
        """Register a single agent programmatically."""
        cls._register(profile)

    @classmethod
    def list_agents(
        cls,
        division_filter: Optional[str] = None,
        expertise_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List agents with optional division or expertise filters."""
        results: List[AgentProfile] = list(cls._by_id.values())

        if division_filter:
            div = str(division_filter).lower()
            results = [a for a in results if a.division.value == div]

        if expertise_filter:
            key = str(expertise_filter).lower()
            results = [
                a for a in results if any(key in (e or "").lower() for e in (a.expertise or []))
            ]

        return [a.public_dict() for a in sorted(results, key=lambda x: x.id)]

    @classmethod
    def get(cls, agent_id: str) -> Optional[AgentProfile]:
        return cls._by_id.get(agent_id)

    @classmethod
    def find_by_name(cls, name: str) -> Optional[AgentProfile]:
        return cls._by_name.get(name.lower())


# Attempt to fetch from cloud (if configured) and then load from YAML on import
try:
    AgentRegistry.load_from_cloud_if_configured()
    AgentRegistry.load_from_yaml()
except Exception:
    # Safe to ignore; users can call bootstrap_yaml() or load_from_yaml() later
    pass
from typing import Dict

from .models import (
    CroweCodeModel,
    CroweCodeAlpha,
    CroweCodeBeta,
    CroweCodeGamma,
    CroweCodeDelta,
    CroweCodeEpsilon,
    CroweCodeZeta,
    CroweCodeEta,
    CroweCodeTheta,
)


class ModelRegistry:
    """
    Internal-only registry of CroweCode models.
    No external tech names appear anywhere; internals can swap freely.
    """

    def __init__(self) -> None:
        # Private, replaceable mapping to engine identifiers.
        # Values are opaque and intentionally generic.
        self._internal_engines: Dict[str, str] = {
            "CroweCode-Alpha": "engine.alpha.v1",
            "CroweCode-Beta": "engine.beta.v1",
            "CroweCode-Gamma": "engine.gamma.v1",
            "CroweCode-Delta": "engine.delta.v1",
            "CroweCode-Epsilon": "engine.epsilon.v1",
            "CroweCode-Zeta": "engine.zeta.v1",
            "CroweCode-Eta": "engine.eta.v1",
            "CroweCode-Theta": "engine.theta.v1",
        }

        # Concrete CroweCode model classes
        self._constructors = {
            "CroweCode-Alpha": CroweCodeAlpha,
            "CroweCode-Beta": CroweCodeBeta,
            "CroweCode-Gamma": CroweCodeGamma,
            "CroweCode-Delta": CroweCodeDelta,
            "CroweCode-Epsilon": CroweCodeEpsilon,
            "CroweCode-Zeta": CroweCodeZeta,
            "CroweCode-Eta": CroweCodeEta,
            "CroweCode-Theta": CroweCodeTheta,
        }

    def get(self, model_name: str) -> CroweCodeModel:
        if model_name not in self._constructors:
            raise KeyError(f"Unknown CroweCode model: {model_name}")
        # The engine id is not used by the mock generators yet, but reserved.
        _engine_id = self._internal_engines.get(model_name)
        return self._constructors[model_name]()

    def list_models(self) -> Dict[str, str]:
        return {
            k: v for k, v in self._internal_engines.items()
        }
