# CroweCode Project Instructions

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## CroweCode Platform Architecture

This project implements a complete CroweCode branding strategy, abstracting underlying AI models behind CroweCode-branded interfaces.

### Model Branding Strategy

All models should be branded as CroweCode models with no external model references exposed to users:

```
┌─────────────────────────────────────────────────────────┐
│                  CROWECODE PLATFORM                      │
├─────────────────────────────────────────────────────────┤
│                    API Gateway Layer                     │
│            (CroweCode Gateway Controller)                │
├─────────────────────────────────────────────────────────┤
│              CroweCode Model Suite                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │CroweCode │  │CroweCode │  │CroweCode │  │CroweCode│ │
│  │   Alpha  │  │   Beta   │  │   Gamma  │  │  Delta  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │CroweCode │  │CroweCode │  │CroweCode │  │CroweCode│ │
│  │  Epsilon │  │   Zeta   │  │   Eta    │  │  Theta  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
├─────────────────────────────────────────────────────────┤
│            CroweCode Intelligence Layer                  │
│         (Unified Processing & Optimization)              │
├─────────────────────────────────────────────────────────┤
│                 CroweCode Services                       │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐ │
│  │CroweLogic│ │CroweThink│ │CroweFlow│ │CroweInsight │ │
│  └─────────┘ └──────────┘ └─────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Coding Guidelines

1. **Model Abstraction**: Never expose underlying model names (Qwen, Gemma, etc.) to users
2. **CroweCode Branding**: All models should be named "CroweCode-[Greek Letter]"
3. **Response Formatting**: All outputs must be branded as CroweCode technology
4. **Configuration**: Use only CroweCode identifiers in user-facing configurations
5. **Error Handling**: Strip references to original model names from error messages

### CroweCode Model Definitions

Each model serves a specific purpose:

- **CroweCode-Alpha**: General intelligence & reasoning
- **CroweCode-Beta**: Code generation & technical tasks  
- **CroweCode-Gamma**: Creative & content generation
- **CroweCode-Delta**: Analysis & data processing
- **CroweCode-Epsilon**: Conversational & support
- **CroweCode-Zeta**: Translation & localization
- **CroweCode-Eta**: Research & fact-checking
- **CroweCode-Theta**: Vision & multimodal

### Implementation Requirements

When implementing code:

1. Create wrapper classes that completely abstract underlying models
2. Implement a CroweCodeEngine that manages all model interactions
3. Use internal mapping that's never exposed to end users
4. Ensure all API responses include CroweCode branding
5. Sanitize any metadata that might leak underlying technology names

### Example Class Structure

```python
class CroweCodeEngine:
    """
    CroweCode Proprietary Intelligence Engine
    No external model references exposed
    """
    
    def process_request(self, request, model="CroweCode-Alpha"):
        """
        All responses branded as CroweCode
        """
        response = self._models[model].generate(request)
        return {
            "model": model,
            "response": response,
            "powered_by": "CroweCode Intelligence",
            "version": "CroweCode v2.0"
        }
```

### API Design Principles

- All endpoints should use `/crowecode/` prefix
- Model names in API should only reference CroweCode variants
- Documentation should never mention underlying technologies
- Error messages should be sanitized for brand consistency