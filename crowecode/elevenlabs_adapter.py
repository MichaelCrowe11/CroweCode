from __future__ import annotations

"""
ElevenLabs ConvAI tools migration adapter
----------------------------------------

Helpers to:
- migrate legacy prompt.tools -> prompt.tool_ids + prompt.built_in_tools
- build prompt config in the new format safely

Does not perform network calls. Provide a resolver to map legacy client/server
tools to their created tool IDs.
"""

from typing import Any, Callable, Dict, List, Optional


BuiltInTools = {
    "end_call",
    "language_detection",
    "transfer_to_agent",
    "transfer_to_number",
    "skip_turn",
}


def build_prompt_config(
    *,
    tool_ids: Optional[List[str]] = None,
    built_in_tools: Optional[Dict[str, Optional[Dict[str, Any]]]] = None,
) -> Dict[str, Any]:
    """Create a new-format prompt config.

    - tool_ids: list of client/server tool IDs (strings)
    - built_in_tools: dict of system tool name -> config or None
    """
    prompt: Dict[str, Any] = {}
    if tool_ids:
        prompt["tool_ids"] = list(tool_ids)
    if built_in_tools:
        # filter to supported names; keep None or config
        prompt["built_in_tools"] = {
            k: v for k, v in built_in_tools.items() if k in BuiltInTools
        }
    return prompt


def migrate_prompt_tools_to_new(
    payload: Dict[str, Any],
    *,
    resolve_tool_id: Optional[Callable[[Dict[str, Any]], Optional[str]]] = None,
) -> Dict[str, Any]:
    """Migrate legacy prompt.tools to prompt.tool_ids + prompt.built_in_tools.

    - payload: full request body or sub-tree containing conversation_config.agent.prompt
    - resolve_tool_id: function that takes a legacy tool object and returns an ID string
      for client/server tools. If not provided, client/server tools are ignored.

    Raises ValueError if both legacy 'tools' and new 'tool_ids' are present.
    """
    # Navigate safely to prompt
    cc = payload.get("conversation_config") or {}
    agent = (cc.get("agent") or {})
    prompt = (agent.get("prompt") or {})

    if "tools" in prompt and "tool_ids" in prompt:
        raise ValueError("Do not send both prompt.tools and prompt.tool_ids in the same request")

    legacy_tools = prompt.get("tools") or []
    if not legacy_tools:
        # Nothing to migrate; return unchanged
        return payload

    # Prepare new fields
    new_tool_ids: List[str] = []
    built_in: Dict[str, Optional[Dict[str, Any]]] = {}

    for tool in legacy_tools:
        ttype = str(tool.get("type", "")).lower()
        name = str(tool.get("name", "")).strip()

        if ttype == "system":
            # System tools go into built_in_tools by name
            if name:
                built_in[name] = {k: v for k, v in tool.items() if k != "type"}
            continue

        # client/server tools must be referenced by ID now
        if resolve_tool_id:
            tid = resolve_tool_id(tool)
            if tid:
                new_tool_ids.append(tid)

    # Write back new-format prompt and remove legacy field
    prompt.pop("tools", None)
    if new_tool_ids:
        prompt["tool_ids"] = new_tool_ids
    if built_in:
        # only include supported names
        prompt["built_in_tools"] = {k: v for k, v in built_in.items() if k in BuiltInTools}

    # Put prompt back
    agent["prompt"] = prompt
    cc["agent"] = agent
    payload["conversation_config"] = cc
    return payload
