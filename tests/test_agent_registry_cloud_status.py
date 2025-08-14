from fastapi.testclient import TestClient
from crowecode.api import app
from crowecode.auth import generate_api_key, hash_api_key
import os

client = TestClient(app)


def setup_api_key():
    key = generate_api_key()
    os.environ["CROWECODE_API_KEYS"] = hash_api_key(key)
    return key


def test_agents_status_endpoint():
    api_key = setup_api_key()
    resp = client.get("/crowe-logic/agents/status", headers={"Authorization": f"Bearer {api_key}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "count" in data
    # At least the registry structure is present; content may vary in CI
    assert "loaded_path" in data


def test_agents_reload_endpoint_noop_without_cloud():
    api_key = setup_api_key()
    # Ensure no cloud env set for this test
    os.environ.pop("CROWECODE_AGENTS_S3_URL", None)
    os.environ.pop("CROWECODE_AGENTS_S3_URL_BACKUP", None)
    os.environ.pop("CROWECODE_AGENTS_S3_URLS", None)

    resp = client.post("/crowe-logic/agents/reload", headers={"Authorization": f"Bearer {api_key}"})
    assert resp.status_code == 200
    data = resp.json()
    # Should reload from local YAML and report a count
    assert data.get("reloaded") is True
    assert isinstance(data.get("count"), int)
