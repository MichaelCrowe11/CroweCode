import pytest
from unittest.mock import patch, MagicMock
from crowecode.backends import MockBackend, TransformersBackend, BackendFactory


def test_mock_backend():
    """Test mock backend functionality."""
    backend = MockBackend("Alpha")
    
    assert backend.is_available() == True
    assert backend.backend_type == "mock"
    
    response = backend.generate("Hello world", max_tokens=50, temperature=0.5)
    assert "CroweCode-Alpha" in response
    assert "Hello world" in response


def test_backend_factory_mock():
    """Test backend factory creates mock backend."""
    with patch.dict('os.environ', {'CROWECODE_BACKEND': 'mock'}):
        backend = BackendFactory.create_backend("Alpha")
        assert isinstance(backend, MockBackend)
        assert backend.backend_type == "mock"


def test_backend_factory_auto_fallback():
    """Test backend factory falls back to mock when transformers unavailable."""
    with patch.dict('os.environ', {'CROWECODE_BACKEND': 'auto'}):
        # Mock transformers as unavailable
        with patch('crowecode.backends.TransformersBackend.is_available', return_value=False):
            backend = BackendFactory.create_backend("Beta")
            assert isinstance(backend, MockBackend)


def test_transformers_backend_fallback():
    """Test transformers backend falls back to mock on errors."""
    backend = TransformersBackend("Gamma")
    
    # Mock failed model loading
    with patch.object(backend, '_load_model') as mock_load:
        mock_load.side_effect = Exception("Model load failed")
        
        response = backend.generate("test prompt")
        assert "CroweCode-Gamma" in response


def test_different_model_variants():
    """Test different model variants produce different responses."""
    variants = ["Alpha", "Beta", "Gamma", "Delta"]
    responses = []
    
    for variant in variants:
        backend = MockBackend(variant)
        response = backend.generate("test prompt")
        responses.append(response)
    
    # All responses should be different
    assert len(set(responses)) == len(responses)
    
    # All should contain their variant name
    for i, variant in enumerate(variants):
        assert f"CroweCode-{variant}" in responses[i]
