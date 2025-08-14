import os, json, base64
from crowecode.engine import CroweCodeEngine


def test_engine_brands_and_sanitizes():
    # Configure banned terms via env (base64 JSON list)
    banned = ["modelx", "modely", "vendorx"]
    os.environ["CROWECODE_BANNED_TERMS_B64"] = base64.b64encode(json.dumps(banned).encode("utf-8")).decode("utf-8")

    engine = CroweCodeEngine()
    prompt = "Compare ModelX and ModelY models briefly from VendorX."
    result = engine.process_request(prompt, model="CroweCode-Alpha")

    assert result["status"] == "success"
    assert result["model"] == "CroweCode-Alpha"
    text = result["response"].lower()
    for term in banned:
        assert term not in text

    assert result.get("metadata", {}).get("powered_by") == "CroweCode Technology"


def test_unknown_model_raises():
    engine = CroweCodeEngine()
    try:
        engine.process_request("x", model="CroweCode-Omega")
    except KeyError as e:
        assert "Unknown CroweCode model" in str(e)
    else:
        raise AssertionError("Expected KeyError for unknown model")
