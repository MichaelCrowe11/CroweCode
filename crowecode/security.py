from __future__ import annotations
import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


class CroweCodeRateLimit:
    """
    Rate limiting for CroweCode API endpoints.
    Tracks requests per IP and per API key.
    """
    
    def __init__(self):
        # Create limiter with IP-based identification
        self.limiter = Limiter(key_func=self._get_identifier)
        
        # Custom rate tracking for API keys
        self._api_key_requests: Dict[str, Tuple[float, int]] = {}
        self._ip_requests: Dict[str, Tuple[float, int]] = {}
    
    def _get_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting."""
        # Try to get API key from Authorization header
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            api_key = auth_header[7:]  # Remove "Bearer " prefix
            return f"api_key:{api_key[:16]}..."  # Truncated for privacy
        
        # Fallback to IP address
        return f"ip:{get_remote_address(request)}"
    
    def check_rate_limit(self, identifier: str, limit: int, window: int) -> bool:
        """
        Check if request is within rate limit.
        
        Args:
            identifier: Unique identifier for the requester
            limit: Maximum requests allowed
            window: Time window in seconds
            
        Returns:
            True if within limit, False otherwise
        """
        now = time.time()
        
        # Clean old entries
        cutoff = now - window
        if identifier in self._api_key_requests:
            last_time, count = self._api_key_requests[identifier]
            if last_time < cutoff:
                del self._api_key_requests[identifier]
        
        # Check current usage
        if identifier in self._api_key_requests:
            last_time, count = self._api_key_requests[identifier]
            if count >= limit:
                return False
            self._api_key_requests[identifier] = (now, count + 1)
        else:
            self._api_key_requests[identifier] = (now, 1)
        
        return True
    
    def get_rate_limit_headers(self, identifier: str, limit: int, window: int) -> Dict[str, str]:
        """Get rate limit headers for response."""
        if identifier in self._api_key_requests:
            _, count = self._api_key_requests[identifier]
            remaining = max(0, limit - count)
        else:
            remaining = limit
        
        return {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Window": str(window),
        }


# Global rate limiter instance
rate_limiter = CroweCodeRateLimit()


def create_rate_limit_dependency(requests_per_minute: int = 60):
    """Create a dependency for rate limiting endpoints."""
    
    async def rate_limit_check(request: Request):
        identifier = rate_limiter._get_identifier(request)
        
        if not rate_limiter.check_rate_limit(identifier, requests_per_minute, 60):
            headers = rate_limiter.get_rate_limit_headers(identifier, requests_per_minute, 60)
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
                headers=headers
            )
        
        return True
    
    return rate_limit_check
