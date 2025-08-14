from __future__ import annotations
import re
from typing import Any
from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator


class CroweCodeRequest(BaseModel):
    """Validated request model with input sanitization."""
    
    model: str = Field(
        default="CroweCode-Alpha",
        description="CroweCode model name",
        pattern=r"^CroweCode-(Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta)$"
    )
    prompt: str = Field(
        ...,
        description="User prompt",
        min_length=1,
        max_length=32768  # 32KB limit
    )
    max_tokens: int = Field(
        default=1024,
        description="Maximum tokens to generate",
        ge=1,
        le=4096
    )
    temperature: float = Field(
        default=0.7,
        description="Sampling temperature",
        ge=0.0,
        le=2.0
    )
    
    @field_validator('prompt')
    @classmethod
    def validate_prompt(cls, v):
        """Sanitize and validate prompt content."""
        if not v or not v.strip():
            raise ValueError("Prompt cannot be empty")
        
        # Check for potential injection patterns
        suspicious_patterns = [
            r'<script[^>]*>',
            r'javascript:',
            r'data:text/html',
            r'vbscript:',
            r'on\w+\s*=',
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Prompt contains potentially unsafe content")
        
        # Truncate if too long (additional safety)
        if len(v) > 32768:
            v = v[:32768]
        
        return v.strip()
    
    @field_validator('model')
    @classmethod
    def validate_model(cls, v):
        """Ensure only valid CroweCode model names."""
        valid_models = {
            "CroweCode-Alpha", "CroweCode-Beta", "CroweCode-Gamma", 
            "CroweCode-Delta", "CroweCode-Epsilon", "CroweCode-Zeta",
            "CroweCode-Eta", "CroweCode-Theta"
        }
        
        if v not in valid_models:
            raise ValueError(f"Invalid model: {v}")
        
        return v


class ValidationError(HTTPException):
    """Custom validation error with CroweCode branding."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=422,
            detail=f"CroweCode Validation Error: {detail}"
        )
