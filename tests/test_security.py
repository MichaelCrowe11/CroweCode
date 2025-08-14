import os
import pytest
from fastapi.testclient import TestClient
from crowecode.api import app
from crowecode.auth import generate_api_key, hash_api_key


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def api_key():
    """Generate a test API key and configure environment."""
    key = generate_api_key()
    key_hash = hash_api_key(key)
    os.environ["CROWECODE_API_KEYS"] = key_hash
    
    # Force reload of auth module to pick up new environment
    from crowecode.auth import CroweCodeAuth
    auth_instance = CroweCodeAuth()
    auth_instance._load_api_keys()
    
    return key


def test_health_check_no_auth(client):
    """Health check should work without authentication."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "CroweCode API"


def test_generate_requires_auth(client):
    """Generate endpoint should require authentication."""
    resp = client.post("/crowecode/generate", json={
        "model": "CroweCode-Alpha",
        "prompt": "test"
    })
    assert resp.status_code == 401
    assert "Invalid or missing API key" in resp.json()["detail"]


def test_models_requires_auth(client):
    """Models endpoint should require authentication."""
    resp = client.get("/crowecode/models")
    assert resp.status_code == 401


def test_generate_with_auth(client, api_key):
    """Generate should work with valid API key."""
    resp = client.post("/crowecode/generate", 
        json={"model": "CroweCode-Alpha", "prompt": "test"},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "CroweCode-Alpha"
    assert "CroweCode Technology" in data["metadata"]["powered_by"]


def test_models_with_auth(client, api_key):
    """Models endpoint should work with valid API key."""
    resp = client.get("/crowecode/models",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "models" in data
    assert len(data["models"]) == 8  # All CroweCode models


def test_input_validation(client, api_key):
    """Test input validation and sanitization."""
    # Invalid model
    resp = client.post("/crowecode/generate",
        json={"model": "Invalid-Model", "prompt": "test"},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 422
    
    # Empty prompt
    resp = client.post("/crowecode/generate",
        json={"model": "CroweCode-Alpha", "prompt": ""},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 422
    
    # Valid request with parameters
    resp = client.post("/crowecode/generate",
        json={
            "model": "CroweCode-Alpha",
            "prompt": "test",
            "max_tokens": 100,
            "temperature": 0.5
        },
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
