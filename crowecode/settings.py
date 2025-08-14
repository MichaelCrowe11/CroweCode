from __future__ import annotations
from pathlib import Path
from typing import Any, Dict
import yaml


class ConfigManager:
    """
    Loads CroweCode configuration without exposing external technologies.
    """

    DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "crowecode-config.yaml"

    def __init__(self, config_path: Path | None = None) -> None:
        self.config_path = Path(config_path) if config_path else self.DEFAULT_CONFIG_PATH
        self._config: Dict[str, Any] = {}

    def load(self) -> Dict[str, Any]:
        if not self._config:
            if self.config_path.exists():
                with open(self.config_path, "r", encoding="utf-8") as f:
                    self._config = yaml.safe_load(f) or {}
            else:
                # Minimal default if no file present
                self._config = {
                    "models": {
                        "crowecode-alpha": {"display_name": "CroweCode Alpha", "capabilities": []},
                        "crowecode-beta": {"display_name": "CroweCode Beta", "capabilities": []},
                        "crowecode-gamma": {"display_name": "CroweCode Gamma", "capabilities": []},
                        "crowecode-delta": {"display_name": "CroweCode Delta", "capabilities": []},
                        "crowecode-epsilon": {"display_name": "CroweCode Epsilon", "capabilities": []},
                        "crowecode-zeta": {"display_name": "CroweCode Zeta", "capabilities": []},
                        "crowecode-eta": {"display_name": "CroweCode Eta", "capabilities": []},
                        "crowecode-theta": {"display_name": "CroweCode Theta", "capabilities": []},
                    }
                }
        return self._config

    def list_public_models(self) -> Dict[str, Dict[str, Any]]:
        cfg = self.load()
        return cfg.get("models", {})
