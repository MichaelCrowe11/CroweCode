from __future__ import annotations
import os
import hashlib
import secrets
from typing import Optional
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


class CroweCodeAuth:
    """
    API key authentication for CroweCode platform.
    Keys are SHA-256 hashed and stored in environment variables.
    """
    
    def __init__(self):
        self.security = HTTPBearer(auto_error=False)
        self._load_api_keys()
    
    def _load_api_keys(self):
        """Load valid API key hashes from environment."""
        # Format: CROWECODE_API_KEYS=hash1,hash2,hash3
        keys_env = os.getenv("CROWECODE_API_KEYS", "")
        self.valid_key_hashes = set()
        
        if keys_env:
            for key_hash in keys_env.split(","):
                key_hash = key_hash.strip()
                if key_hash:
                    self.valid_key_hashes.add(key_hash)
        
        # Development fallback - create a default key if none configured
        if not self.valid_key_hashes:
            default_key = "crowecode-dev-key-12345"
            default_hash = self._hash_key(default_key)
            self.valid_key_hashes.add(default_hash)
            print(f"⚠️  Using development API key: {default_key}")
            print(f"   Hash: {default_hash}")
    
    def _hash_key(self, api_key: str) -> str:
        """Create SHA-256 hash of API key."""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    async def verify_api_key(self, request: Request) -> bool:
        """Verify API key from Authorization header."""
        credentials: Optional[HTTPAuthorizationCredentials] = await self.security(request)
        
        if not credentials:
            return False
        
        api_key = credentials.credentials
        key_hash = self._hash_key(api_key)
        
        # Reload keys dynamically for testing
        self._load_api_keys()
        
        return key_hash in self.valid_key_hashes
    
    async def require_api_key(self, request: Request):
        """Dependency that requires valid API key."""
        if not await self.verify_api_key(request):
            raise HTTPException(
                status_code=401,
                detail="Invalid or missing API key",
                headers={"WWW-Authenticate": "Bearer"},
            )


def generate_api_key() -> str:
    """Generate a new secure API key."""
    return f"crowecode-{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """Hash an API key for storage."""
    return hashlib.sha256(api_key.encode()).hexdigest()
