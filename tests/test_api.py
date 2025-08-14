import os, json, base64
from fastapi.testclient import TestClient
from crowecode.api import app
from crowecode.auth import generate_api_key, hash_api_key


client = TestClient(app)


def setup_api_key():
    """Set up API key for testing."""
    key = generate_api_key()
    key_hash = hash_api_key(key)
    os.environ["CROWECODE_API_KEYS"] = key_hash
    return key


def test_list_models():
    api_key = setup_api_key()
    resp = client.get("/crowecode/models", headers={"Authorization": f"Bearer {api_key}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "models" in data
    assert any(m["id"] == "crowecode-alpha" for m in data["models"])  # at least alpha exists


def test_generate_endpoint():
    api_key = setup_api_key()
    # Configure banned terms via env (base64 JSON list)
    banned = ["modelx", "modely", "vendorx"]
    os.environ["CROWECODE_BANNED_TERMS_B64"] = base64.b64encode(json.dumps(banned).encode("utf-8")).decode("utf-8")
    body = {"model": "CroweCode-Alpha", "prompt": "Say hello from ModelX and ModelY by VendorX"}
    resp = client.post("/crowecode/generate", json=body, headers={"Authorization": f"Bearer {api_key}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "CroweCode-Alpha"
    txt = data["response"].lower()
    for term in banned:
        assert term not in txt
    assert data.get("metadata", {}).get("powered_by") == "CroweCode Technology"
