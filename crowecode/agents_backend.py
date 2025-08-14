from __future__ import annotations

"""
Strands Agents Backend Integration
=================================

Thin wrapper around the `strands` library to power agentic workflows in the
Crowe Logic platform. Falls back to a safe mock if the library isn't
available or runtime configuration is missing.
"""

from typing import Any, Dict
import os


class _MockAgent:
    """Deterministic fallback agent that echoes prompts with guidance."""

    def __call__(self, prompt: str) -> str:
        return (
            "[Mock Agent]\n"
            "You asked for an agentic response. The real Strands Agent isn't "
            "configured in this environment, so here's a safe placeholder.\n\n"
            f"Prompt: {prompt}\n\n"
            "Next steps: Configure provider credentials (e.g., OPENAI_API_KEY) "
            "or set CROWECODE_STRANDS_MOCK=false to attempt real execution."
        )


class StrandsAgentBackend:
    """Backend for Strands Agents with safe fallback behavior."""

    def __init__(self) -> None:
        self.mock_mode = False
        self._agent = None
        self._init_agent()

    def _init_agent(self) -> None:
        use_mock_env = os.getenv("CROWECODE_STRANDS_MOCK", "true").lower()
        use_mock = use_mock_env in ("1", "true", "yes")

        try:
            if use_mock:
                self.mock_mode = True
                self._agent = _MockAgent()
                return

            # Try real Strands Agent
            from strands import Agent  # type: ignore

            # Optional: allow simple provider selection via env vars
            # The Strands library typically auto-detects configured providers
            # (e.g., OpenAI) via environment variables.
            self._agent = Agent()
            self.mock_mode = False
        except Exception:
            # Fall back to mock if anything goes wrong
            self._agent = _MockAgent()
            self.mock_mode = True

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model_id": "crowe-logic-agent",
            "display_name": "Crowe Logic Agent",
            "description": "Agentic orchestration powered by Strands Agents.",
            "capabilities": [
                "tool_use",
                "multi-step_reasoning",
                "workflow_orchestration",
            ],
            "mock_mode": self.mock_mode,
            "requirements": {
                "env": [
                    "OPENAI_API_KEY (optional, for real providers)",
                    "CROWECODE_STRANDS_MOCK (default true)",
                ]
            },
        }

    def run(self, prompt: str) -> Dict[str, Any]:
        """Execute the agent with the given prompt and return normalized output."""
        if not self._agent:
            self._init_agent()

        try:
            output = self._agent(prompt)
            text = output if isinstance(output, str) else str(output)
            return {
                "provider": "Crowe Logic",
                "model": "crowe-logic-agent",
                "response": text,
                "usage_metadata": {
                    # Without provider hooks, we can't count tokens; return a minimal stub
                    "input_tokens": max(1, len(prompt) // 4),
                    "output_tokens": max(1, len(text) // 4),
                },
                "mock": self.mock_mode,
            }
        except Exception as e:
            # Shield upstream exceptions and return structured error
            return {
                "provider": "Crowe Logic",
                "model": "crowe-logic-agent",
                "error": str(e),
                "mock": self.mock_mode,
            }


def create_agents_backend() -> StrandsAgentBackend:
    return StrandsAgentBackend()
