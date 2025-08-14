# CroweCode Model Setup Guide

## Quick Answer: Do You Need to Download Models?

**For Development & Testing:** No! CroweCode automatically uses mock backends when real models aren't available.

**For Production:** Yes, download the Qwen3-Coder models that power CroweCode.

## Recommended Models by Use Case

### 🔧 Development Setup (Fastest)
```bash
python crowecode/download_models.py --dev
```
Downloads:
- **CroweCode-Alpha** (7B) - Fast for testing (~15GB)
- **CroweCode-Beta** (30B) - Good balance (~60GB)

### 🚀 Production Setup (Best Quality)
```bash
python crowecode/download_models.py --all
```
Downloads all 8 CroweCode variants:
- **7B models** (Alpha, Delta, Zeta) - Fast inference
- **30B models** (Beta, Epsilon, Eta) - Balanced performance  
- **480B models** (Gamma, Theta) - Highest quality

### 🎯 Custom Setup
```bash
# Just the essentials
python crowecode/download_models.py Alpha Gamma

# High-performance only  
python crowecode/download_models.py Beta Epsilon Eta
```

## Prerequisites

### 1. Install KaggleHub
```bash
pip install kagglehub
```

### 2. Kaggle Authentication
```bash
# Method 1: Interactive login
kaggle auth

# Method 2: API key (create at kaggle.com/settings)
export KAGGLE_USERNAME="your-username"
export KAGGLE_KEY="your-api-key"
```

## Model Information

### CroweCode Model Architecture

| CroweCode Variant | Model Size | Use Case | Download Priority |
|-------------------|------------|----------|-------------------|
| **Alpha** | 7B | Development, Fast inference | ⭐⭐⭐ |
| **Beta** | 30B | Balanced production | ⭐⭐⭐ |
| **Gamma** | 480B | Highest quality | ⭐⭐ |
| **Delta** | 7B | Alternative fast model | ⭐ |
| **Epsilon** | 30B | Alternative balanced | ⭐ |
| **Zeta** | 7B | Specialized variant | ⭐ |
| **Eta** | 30B | Advanced balanced | ⭐ |
| **Theta** | 480B | Premium quality | ⭐ |

### Storage Requirements

- **7B models**: ~15GB each
- **30B models**: ~60GB each  
- **480B models**: ~960GB each

**Recommendations:**
- **Laptop/Dev**: Alpha + Beta (~75GB)
- **Server/Prod**: All models (~2.1TB)
- **Budget**: Alpha only (~15GB)

## Usage Examples

### Check What's Available
```bash
# List all CroweCode models
python crowecode/download_models.py --list

# Check download status
python crowecode/download_models.py --status
```

### Download Scenarios

```bash
# Minimal setup (just one model)
python crowecode/download_models.py Alpha

# Recommended development setup  
python crowecode/download_models.py --dev

# Full production setup
python crowecode/download_models.py --all

# Custom selection
python crowecode/download_models.py Alpha Beta Gamma
```

### Using in Code

```python
from crowecode.models import CroweCodeAlpha, CroweCodeBeta

# Will automatically use downloaded models or fall back to mock
alpha = CroweCodeAlpha()
result = alpha.generate("Write a Python function to sort a list")

beta = CroweCodeBeta()  
result = beta.generate("Explain quantum computing")
```

## Deployment Strategies

### Development Environment
```bash
# Quick setup for testing
python crowecode/download_models.py --dev
export CROWECODE_BACKEND=auto  # Auto-detects available models
```

### Production Environment
```bash
# Full model suite
python crowecode/download_models.py --all
export CROWECODE_BACKEND=qwen  # Force Qwen backend
export CROWECODE_API_KEY="your-production-key"
```

### CI/CD Environment
```bash
# No models needed - uses mock backend
export CROWECODE_BACKEND=mock
# Tests will run without downloading anything
```

## Troubleshooting

### Models Not Downloaded?
```bash
# Check status
python crowecode/download_models.py --status

# Verify kagglehub
python -c "import kagglehub; print('✅ KaggleHub available')"

# Test download
python crowecode/download_models.py Alpha
```

### Authentication Issues?
```bash
# Re-authenticate
kaggle auth

# Or set environment variables
export KAGGLE_USERNAME="your-username"  
export KAGGLE_KEY="your-api-key"
```

### Storage Issues?
```bash
# Download just essential models
python crowecode/download_models.py Alpha

# Or use mock backend (no download needed)
export CROWECODE_BACKEND=mock
```

## Model Updates

CroweCode automatically handles model versioning. To update:

```bash
# Clear cache and re-download
rm -rf ~/.cache/kagglehub/models/qwen-lm/
python crowecode/download_models.py --all
```

---

**🚀 Ready to go?** Start with `python crowecode/download_models.py --dev` for the fastest setup!
