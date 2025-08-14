# CroweCode Qwen3 Integration Guide

## 🚀 Quick Start with Qwen3 Models

The CroweCode platform now supports Qwen3 Coder models while maintaining complete branding abstraction.

### Option 1: Download Specific Models

```bash
# Install dependencies
pip install kagglehub

# Download CroweCode-Beta (uses Qwen3 30B for code generation)
python download_models.py --variant Beta

# Download CroweCode-Alpha (uses Qwen3 7B for reasoning)  
python download_models.py --variant Alpha
```

### Option 2: Download All Models

```bash
# Download all 8 CroweCode models (will take time and space)
python download_models.py --all
```

### Option 3: Custom Model Configuration

```bash
# Configure which Qwen models map to CroweCode variants
export CROWECODE_QWEN_MAPPING_B64=$(echo '{
  "Alpha": "qwen-lm/qwen3-coder/transformers/7b-instruct",
  "Beta": "qwen-lm/qwen3-coder/transformers/30b-a3b-instruct",
  "Gamma": "qwen-lm/qwen3-coder/transformers/7b-instruct"
}' | base64 -w 0)

# Use Qwen backend
export CROWECODE_BACKEND=qwen

# Start server
python -m crowecode
```

## 🎯 Model Recommendations

### For Development/Testing
- **CroweCode-Alpha**: Qwen3 7B (reasoning & analysis)
- **CroweCode-Beta**: Qwen3 7B (code generation)
- Total: ~14GB

### For Production
- **CroweCode-Alpha**: Qwen3 7B (general reasoning)
- **CroweCode-Beta**: Qwen3 30B (advanced code generation)
- **CroweCode-Gamma**: Qwen3 7B (creative writing)
- Total: ~50GB

## 🔧 System Requirements

### Minimum (7B models)
- RAM: 16GB
- Storage: 20GB free
- GPU: Optional (4GB VRAM)

### Recommended (30B models)
- RAM: 32GB
- Storage: 100GB free  
- GPU: 24GB VRAM (RTX 4090/A6000)

## 📋 Usage Examples

```bash
# Check model status
python download_models.py --list

# Download just the code specialist
python download_models.py --variant Beta

# Force re-download
python download_models.py --variant Alpha --force

# Test with API
curl -H "Authorization: Bearer crowecode-dev-key-12345" \
     -H "Content-Type: application/json" \
     -d '{"model":"CroweCode-Beta","prompt":"Write a Python function to sort a list"}' \
     http://localhost:8000/crowecode/generate
```

## 🛡️ Privacy & Branding

- ✅ All Qwen model names are completely hidden from API responses
- ✅ Only "CroweCode-Alpha", "CroweCode-Beta" etc. are visible to users
- ✅ Internal model mappings are configurable via environment variables
- ✅ Model downloads are cached locally

## 🚀 Next Steps

1. **Download your preferred models**:
   ```bash
   python download_models.py --variant Beta  # For code generation
   ```

2. **Configure backend**:
   ```bash
   export CROWECODE_BACKEND=qwen
   ```

3. **Start the server**:
   ```bash
   python -m crowecode
   ```

4. **Test the API**:
   ```bash
   curl -H "Authorization: Bearer crowecode-dev-key-12345" \
        -H "Content-Type: application/json" \
        -d '{"model":"CroweCode-Beta","prompt":"Hello world"}' \
        http://localhost:8000/crowecode/generate
   ```

The CroweCode platform will automatically use your downloaded Qwen models while maintaining complete branding abstraction!
