import os
from fastapi.testclient import TestClient
from crowecode.api import app
from crowecode.auth import generate_api_key, hash_api_key
from crowecode.subscriptions import subscription_manager, SubscriptionTier

client = TestClient(app)


def setup_api_key():
    key = generate_api_key()
    os.environ["CROWECODE_API_KEYS"] = hash_api_key(key)
    # Create a Professional subscription so agent run passes tier checks
    subscription_manager.create_subscription(key, SubscriptionTier.PROFESSIONAL, "test_customer")
    return key


def test_run_specific_agent_cl001():
    api_key = setup_api_key()
    body = {"prompt": "Summarize our Q3 strategy", "analysis_type": "general", "depth": 3}
    resp = client.post(
        "/crowe-logic/agents/CL-001/run",
        json=body,
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["agent_id"] == "CL-001"
    assert data["provider"] == "Crowe Logic"
    assert data["mock_mode"] is True
    assert "response" in data and "details" in data["response"]
