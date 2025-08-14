from fastapi.testclient import TestClient
from crowecode.api import app
from crowecode.auth import generate_api_key, hash_api_key
import os

client = TestClient(app)


def setup_api_key():
    key = generate_api_key()
    os.environ["CROWECODE_API_KEYS"] = hash_api_key(key)
    return key


def test_list_agents_endpoint():
    api_key = setup_api_key()
    resp = client.get("/crowe-logic/agents", headers={"Authorization": f"Bearer {api_key}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "agents" in data and isinstance(data["agents"], list)
    assert data["count"] == len(data["agents"])  # consistency


def test_get_agent_endpoint():
    api_key = setup_api_key()
    resp = client.get("/crowe-logic/agents/CL-001", headers={"Authorization": f"Bearer {api_key}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "CL-001"
    assert data["name"].lower().startswith("marcus")
