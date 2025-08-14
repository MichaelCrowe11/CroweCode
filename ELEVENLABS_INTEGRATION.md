# ElevenLabs Conversational AI: Libraries, SDKs, and Crowe Logic Integration

This guide points to the official ElevenLabs libraries and shows how to use them alongside our `crowecode.elevenlabs_adapter` helpers for the prompt.tools migration.

## Official REST API libraries

- Python: GitHub README — [elevenlabs/elevenlabs-python](https://github.com/elevenlabs/elevenlabs-python) • PyPI — [elevenlabs](https://pypi.org/project/elevenlabs/)
- JavaScript (Node): GitHub README — [elevenlabs/elevenlabs-js](https://github.com/elevenlabs/elevenlabs-js) • npm — [@elevenlabs/elevenlabs-js](https://www.npmjs.com/package/@elevenlabs/elevenlabs-js)

Postman collection: [ElevenLabs API Documentation](https://www.postman.com/elevenlabs/elevenlabs/collection/7i9rytu/elevenlabs-api-documentation?action=share&creator=39903018)

## Conversational AI libraries

- JavaScript client: Docs — [JavaScript Client](https://elevenlabs.io/docs/conversational-ai/libraries/java-script) • npm — [@elevenlabs/client](https://www.npmjs.com/package/@elevenlabs/client)
- React: Docs — [React](https://elevenlabs.io/docs/conversational-ai/libraries/react) • npm — [@elevenlabs/react](https://www.npmjs.com/package/@elevenlabs/react)
- React Native: Docs — [React Native](https://elevenlabs.io/docs/conversational-ai/libraries/react-native) • npm — [@elevenlabs/react-native](https://www.npmjs.com/package/@elevenlabs/react-native)
- Python: Docs — [Python](https://elevenlabs.io/docs/conversational-ai/libraries/python) • PyPI — [elevenlabs](https://pypi.org/project/elevenlabs/)
- Swift: Docs — [Swift](https://elevenlabs.io/docs/conversational-ai/libraries/swift) • GitHub — [ElevenLabsSwift](https://github.com/elevenlabs/ElevenLabsSwift)

Community:

- Vercel AI SDK: Docs — [Vercel AI SDK](https://elevenlabs.io/docs/cookbooks/speech-to-text/vercel-ai-sdk) • npm — [ai](https://www.npmjs.com/package/ai)

### Using with Crowe Logic

Our adapter helps migrate legacy payloads using `prompt.tools` into the new fields `prompt.tool_ids` and `prompt.built_in_tools`.

- Module: `crowecode.elevenlabs_adapter`
- Functions:
  - `migrate_prompt_tools_to_new(payload, resolve_tool_id=...)`
  - `build_prompt_config(tool_ids=[...], built_in_tools={...})`

Contract (inputs/outputs):

- Input: dict payload containing `conversation_config.agent.prompt`.
- Output: same payload dict with legacy `prompt.tools` removed and new fields populated.
- Error: raises `ValueError` if both `prompt.tools` and `prompt.tool_ids` are present.

Python example (payload migration):

```python
from crowecode.elevenlabs_adapter import migrate_prompt_tools_to_new

payload = {
    "conversation_config": {
        "agent": {
            "prompt": {
                "tools": [
                    {"type": "client", "name": "open_url"},
                    {"type": "system", "name": "end_call", "response_timeout_secs": 20},
                ]
            }
        }
    }
}

def resolve_tool_id(tool: dict) -> str | None:
    # Map legacy client/server tool to a created tool ID from your ElevenLabs account
    if tool.get("type") == "client" and tool.get("name") == "open_url":
        return "tool_123"
    return None

new_payload = migrate_prompt_tools_to_new(payload, resolve_tool_id=resolve_tool_id)
# Send new_payload to ElevenLabs using their official SDK or HTTP client
```

JavaScript outline (using official clients):

```js
// 1) Use Crowe Logic to prepare the prompt config on the server (Python shown above)
// 2) Call ElevenLabs from your JS app with the migrated payload

// Example: using fetch or the official @elevenlabs/elevenlabs-js client to POST
// (Refer to the official SDK docs for auth and endpoint details.)
```

Edge cases to consider:

- Empty or missing `prompt.tools` → no changes.
- Mixed legacy/new fields → adapter raises to prevent silent conflicts.
- Only system tools present → goes into `prompt.built_in_tools`.
- No resolver provided → client/server tools are ignored (only system tools migrate).

Tests

- See `tests/test_elevenlabs_adapter.py` for migration behaviors and config filtering.
