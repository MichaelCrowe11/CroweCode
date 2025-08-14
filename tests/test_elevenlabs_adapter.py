from __future__ import annotations

import pytest

from crowecode.elevenlabs_adapter import (
    migrate_prompt_tools_to_new,
    build_prompt_config,
)


def test_migrate_legacy_tools_to_new_with_resolver():
    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    "tools": [
                        {"type": "client", "name": "open_url", "description": "Open a URL"},
                        {
                            "type": "system",
                            "name": "end_call",
                            "response_timeout_secs": 20,
                            "params": {"system_tool_type": "end_call"},
                        },
                    ]
                }
            }
        }
    }

    def resolver(tool: dict) -> str | None:
        if tool.get("type") == "client" and tool.get("name") == "open_url":
            return "tool_123"
        return None

    out = migrate_prompt_tools_to_new(payload, resolve_tool_id=resolver)
    prompt = out["conversation_config"]["agent"]["prompt"]
    assert "tools" not in prompt
    assert prompt["tool_ids"] == ["tool_123"]
    assert "built_in_tools" in prompt and "end_call" in prompt["built_in_tools"]


def test_migrate_legacy_no_resolver_system_only():
    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    "tools": [
                        {"type": "system", "name": "language_detection"},
                        {"type": "system", "name": "transfer_to_number"},
                    ]
                }
            }
        }
    }

    out = migrate_prompt_tools_to_new(payload)
    prompt = out["conversation_config"]["agent"]["prompt"]
    assert "tools" not in prompt
    assert "tool_ids" not in prompt  # no resolver -> no client/server IDs
    assert set(prompt["built_in_tools"].keys()) == {"language_detection", "transfer_to_number"}


def test_migrate_raises_when_both_fields_present():
    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    "tools": [{"type": "client", "name": "open_url"}],
                    "tool_ids": ["tool_existing"],
                }
            }
        }
    }
    with pytest.raises(ValueError):
        migrate_prompt_tools_to_new(payload)


def test_build_prompt_config_filters_built_in_names():
    cfg = build_prompt_config(
        tool_ids=["a", "b"],
        built_in_tools={
            "end_call": {"response_timeout_secs": 20},
            "unsupported": {},
        },
    )
    assert cfg["tool_ids"] == ["a", "b"]
    assert "end_call" in cfg["built_in_tools"]
    assert "unsupported" not in cfg["built_in_tools"]
