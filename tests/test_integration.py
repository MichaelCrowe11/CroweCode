import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from crowecode.api import app
from crowecode.auth import generate_api_key, hash_api_key
from crowecode.backends import BackendFactory, MockBackend


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def api_key():
    """Set up API key for testing."""
    key = generate_api_key()
    key_hash = hash_api_key(key)
    os.environ["CROWECODE_API_KEYS"] = key_hash
    return key


def test_model_integration_alpha(client, api_key):
    """Test CroweCode-Alpha with backend integration."""
    resp = client.post("/crowecode/generate",
        json={"model": "CroweCode-Alpha", "prompt": "Analyze this data", "max_tokens": 100},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "CroweCode-Alpha"
    assert "CroweCode-Alpha" in data["response"]
    assert "intelligent analysis" in data["response"].lower()


def test_model_integration_beta(client, api_key):
    """Test CroweCode-Beta (code specialist) with backend."""
    resp = client.post("/crowecode/generate",
        json={"model": "CroweCode-Beta", "prompt": "Write a Python function", "max_tokens": 200},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "CroweCode-Beta"
    assert "CroweCode-Beta" in data["response"]
    # Beta should return code-like responses
    assert any(keyword in data["response"].lower() for keyword in ["function", "code", "//"])


def test_model_integration_gamma(client, api_key):
    """Test CroweCode-Gamma (creative) with backend."""
    resp = client.post("/crowecode/generate",
        json={"model": "CroweCode-Gamma", "prompt": "Tell a story", "max_tokens": 150},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "CroweCode-Gamma"
    assert "CroweCode-Gamma" in data["response"]
    # Gamma should return creative responses
    assert any(keyword in data["response"].lower() for keyword in ["creates", "story", "once upon"])


def test_admin_backend_status(client, api_key):
    """Test admin endpoint for backend status."""
    resp = client.get("/admin/backend-status",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "backend_status" in data
    assert "total_models" in data
    assert "available_models" in data
    
    # Should have status for all 8 models
    assert data["total_models"] == 8
    
    # Check that at least Alpha model is present
    assert "CroweCode-Alpha" in data["backend_status"]
    alpha_status = data["backend_status"]["CroweCode-Alpha"]
    assert "backend_type" in alpha_status
    assert "available" in alpha_status


def test_admin_model_info(client, api_key):
    """Test admin endpoint for specific model info."""
    resp = client.get("/admin/model-info/CroweCode-Alpha",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_name"] == "CroweCode-Alpha"
    assert "backend_info" in data
    assert "capabilities" in data


def test_backend_environment_override():
    """Test backend selection via environment variable."""
    # Force mock backend
    with patch.dict(os.environ, {"CROWECODE_BACKEND": "mock"}):
        factory = BackendFactory()
        backend = factory.create_backend("Alpha")
        assert isinstance(backend, MockBackend)


def test_parameter_forwarding(client, api_key):
    """Test that generation parameters are properly forwarded to backends."""
    resp = client.post("/crowecode/generate",
        json={
            "model": "CroweCode-Alpha",
            "prompt": "Short response please",
            "max_tokens": 20,
            "temperature": 0.1
        },
        headers={"Authorization": f"Bearer {api_key}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    
    # Verify parameters are in metadata
    assert data["metadata"]["max_tokens"] == 20
    assert data["metadata"]["temperature"] == 0.1
