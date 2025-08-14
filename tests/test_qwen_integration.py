import os
import base64
import pytest
from unittest.mock import patch, MagicMock
from crowecode.qwen_integration import QwenModelManager


def test_qwen_manager_initialization():
    """Test QwenModelManager initialization."""
    manager = QwenModelManager()
    assert manager is not None


def test_qwen_manager_default_mapping():
    """Test default CroweCode model mapping."""
    manager = QwenModelManager()
    models = manager.list_models()
    
    # Should have 8 CroweCode models
    assert len(models) == 8
    assert all(model.startswith("crowecode-") for model in models)
    
    # Test specific mappings
    assert "crowecode-alpha" in models
    assert "crowecode-beta" in models
    assert "crowecode-gamma" in models


def test_qwen_manager_custom_mapping():
    """Test custom model mapping via environment."""
    # Create custom mapping
    custom_mapping = {
        "test": "qwen-lm/qwen3-coder/transformers/7b-instruct"
    }
    custom_b64 = base64.b64encode(
        str(custom_mapping).replace("'", '"').encode()
    ).decode()
    
    # Test with custom mapping
    with patch.dict('os.environ', {'CROWECODE_QWEN_MAPPING_B64': custom_b64}):
        manager = QwenModelManager()
        models = manager.list_models()
        assert "crowecode-test" in models


def test_qwen_manager_availability_check():
    """Test Qwen availability checking."""
    manager = QwenModelManager()
    
    # Mock kagglehub as not available
    with patch.object(manager, '_get_kagglehub', return_value=None):
        assert manager.is_available() is False
    
    # Mock kagglehub as available
    mock_kaggle = MagicMock()
    with patch.object(manager, '_get_kagglehub', return_value=mock_kaggle):
        assert manager.is_available() is True


def test_qwen_manager_download_failure():
    """Test download failure handling."""
    manager = QwenModelManager()
    
    # Mock failed download
    mock_kaggle = MagicMock()
    mock_kaggle.model_download.side_effect = Exception("Download failed")
    
    with patch.object(manager, '_get_kagglehub', return_value=mock_kaggle):
        result = manager.download_model("Alpha")  # Use capitalized variant
        assert result is None


def test_qwen_manager_download_success():
    """Test successful download."""
    manager = QwenModelManager()
    
    # Mock successful download
    mock_kaggle = MagicMock()
    mock_kaggle.model_download.return_value = "/path/to/model"
    
    with patch.object(manager, '_get_kagglehub', return_value=mock_kaggle):
        result = manager.download_model("Alpha")  # Use capitalized variant
        assert result == "/path/to/model"
        
        # Verify kagglehub was called with correct parameters
        mock_kaggle.model_download.assert_called_once()


def test_qwen_manager_list_models():
    """Test model listing."""
    manager = QwenModelManager()
    models = manager.list_models()
    
    # Should return list of CroweCode model names
    assert isinstance(models, list)
    assert len(models) > 0
    assert all(isinstance(model, str) for model in models)


def test_qwen_manager_caching():
    """Test that model paths are cached."""
    manager = QwenModelManager()
    
    # Mock successful download
    mock_kaggle = MagicMock()
    mock_kaggle.model_download.return_value = "/path/to/model"
    
    with patch.object(manager, '_get_kagglehub', return_value=mock_kaggle):
        # First call should download
        result1 = manager.get_model_path("Alpha")  # Use capitalized variant
        assert result1 == "/path/to/model"
        
        # Second call should use cache
        result2 = manager.get_model_path("Alpha")
        assert result2 == "/path/to/model"
        
        # Should only have called download once
        assert mock_kaggle.model_download.call_count == 1
