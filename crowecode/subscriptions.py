"""
Crowe Logic Subscription Management System
=========================================

Implements tiered pricing and subscription validation for:
- Logic Essentials ($99/month)
- Logic Professional ($499/month) 
- Logic Enterprise ($2,499/month)
- Logic Enterprise Plus ($9,999/month)
"""

from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta


class SubscriptionTier(str, Enum):
    """Subscription tier definitions."""
    ESSENTIALS = "essentials"
    PROFESSIONAL = "professional" 
    ENTERPRISE = "enterprise"
    ENTERPRISE_PLUS = "enterprise_plus"
    FREEMIUM = "freemium"


class SubscriptionLimits(BaseModel):
    """Subscription limits and features per tier."""
    monthly_api_calls: int
    available_models: list[str]
    support_level: str
    sla_uptime: str
    custom_models: bool
    priority_support: bool
    dedicated_support: bool
    white_glove_onboarding: bool
    
    
class SubscriptionConfig:
    """Configuration for subscription tiers and limits."""
    
    TIER_LIMITS = {
        SubscriptionTier.FREEMIUM: SubscriptionLimits(
            monthly_api_calls=1000,
            available_models=["crowe-logic-assistant"],
            support_level="community",
            sla_uptime="99.0%",
            custom_models=False,
            priority_support=False,
            dedicated_support=False,
            white_glove_onboarding=False
        ),
        SubscriptionTier.ESSENTIALS: SubscriptionLimits(
            monthly_api_calls=10000,
            available_models=[
                "crowe-logic-analytics",
                "crowe-logic-assistant", 
                "crowe-logic-development"
            ],
            support_level="email",
            sla_uptime="99.9%",
            custom_models=False,
            priority_support=False,
            dedicated_support=False,
            white_glove_onboarding=False
        ),
        SubscriptionTier.PROFESSIONAL: SubscriptionLimits(
            monthly_api_calls=100000,
            available_models=[
                "crowe-logic-analytics",
                "crowe-logic-development",
                "crowe-logic-creative", 
                "crowe-logic-intelligence",
                "crowe-logic-assistant",
                "crowe-logic-research",
                "crowe-logic-agent"
            ],
            support_level="priority",
            sla_uptime="99.95%",
            custom_models=True,  # Limited
            priority_support=True,
            dedicated_support=False,
            white_glove_onboarding=False
        ),
        SubscriptionTier.ENTERPRISE: SubscriptionLimits(
            monthly_api_calls=1000000,
            available_models=[
                "crowe-logic-analytics",
                "crowe-logic-development",
                "crowe-logic-creative",
                "crowe-logic-intelligence", 
                "crowe-logic-assistant",
                "crowe-logic-global",
                "crowe-logic-research",
                "crowe-logic-custom"
            ],
            support_level="dedicated",
            sla_uptime="99.99%",
            custom_models=True,
            priority_support=True,
            dedicated_support=True,
            white_glove_onboarding=True
        ),
        SubscriptionTier.ENTERPRISE_PLUS: SubscriptionLimits(
            monthly_api_calls=-1,  # Unlimited
            available_models=[
                "crowe-logic-analytics",
                "crowe-logic-development", 
                "crowe-logic-creative",
                "crowe-logic-intelligence",
                "crowe-logic-assistant",
                "crowe-logic-global",
                "crowe-logic-research",
                "crowe-logic-custom"
            ],
            support_level="white_glove",
            sla_uptime="99.999%",
            custom_models=True,
            priority_support=True,
            dedicated_support=True,
            white_glove_onboarding=True
        )
    }
    
    TIER_PRICING = {
        SubscriptionTier.FREEMIUM: 0,
        SubscriptionTier.ESSENTIALS: 99,
        SubscriptionTier.PROFESSIONAL: 499,
        SubscriptionTier.ENTERPRISE: 2499,
        SubscriptionTier.ENTERPRISE_PLUS: 9999
    }


class UsageTracker:
    """Track API usage for billing and rate limiting."""
    
    def __init__(self):
        self.usage_data: Dict[str, Dict[str, Any]] = {}
    
    def track_usage(self, api_key: str, model: str, tokens_used: int = 1):
        """Track API usage for a customer."""
        current_month = datetime.now().strftime("%Y-%m")
        
        if api_key not in self.usage_data:
            self.usage_data[api_key] = {}
            
        if current_month not in self.usage_data[api_key]:
            self.usage_data[api_key][current_month] = {
                "total_calls": 0,
                "models_used": {},
                "last_updated": datetime.now()
            }
        
        # Update usage
        self.usage_data[api_key][current_month]["total_calls"] += 1
        self.usage_data[api_key][current_month]["last_updated"] = datetime.now()
        
        if model not in self.usage_data[api_key][current_month]["models_used"]:
            self.usage_data[api_key][current_month]["models_used"][model] = 0
        self.usage_data[api_key][current_month]["models_used"][model] += 1
    
    def get_monthly_usage(self, api_key: str) -> Dict[str, Any]:
        """Get current month usage for an API key."""
        current_month = datetime.now().strftime("%Y-%m")
        
        if api_key not in self.usage_data or current_month not in self.usage_data[api_key]:
            return {
                "total_calls": 0,
                "models_used": {},
                "period": current_month
            }
        
        return {
            **self.usage_data[api_key][current_month],
            "period": current_month
        }
    
    def check_usage_limit(self, api_key: str, tier: SubscriptionTier) -> bool:
        """Check if user has exceeded their usage limit."""
        usage = self.get_monthly_usage(api_key)
        limits = SubscriptionConfig.TIER_LIMITS[tier]
        
        # Unlimited for Enterprise Plus
        if limits.monthly_api_calls == -1:
            return True
            
        return usage["total_calls"] < limits.monthly_api_calls


class SubscriptionManager:
    """Manage customer subscriptions and validation."""
    
    def __init__(self):
        self.subscriptions: Dict[str, Dict[str, Any]] = {}
        self.usage_tracker = UsageTracker()
    
    def create_subscription(self, api_key: str, tier: SubscriptionTier, customer_id: str):
        """Create a new subscription."""
        self.subscriptions[api_key] = {
            "tier": tier,
            "customer_id": customer_id,
            "created_at": datetime.now(),
            "status": "active",
            "next_billing_date": datetime.now() + timedelta(days=30)
        }
    
    def get_subscription(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Get subscription details for an API key."""
        return self.subscriptions.get(api_key)
    
    def validate_model_access(self, api_key: str, model: str) -> bool:
        """Validate if user has access to a specific model."""
        subscription = self.get_subscription(api_key)
        if not subscription:
            return False  # No subscription found
            
        tier = subscription["tier"]
        limits = SubscriptionConfig.TIER_LIMITS[tier]
        
        return model in limits.available_models
    
    def validate_usage_limit(self, api_key: str) -> bool:
        """Validate if user is within usage limits."""
        subscription = self.get_subscription(api_key)
        if not subscription:
            return False
            
        tier = subscription["tier"]
        return self.usage_tracker.check_usage_limit(api_key, tier)
    
    def track_api_usage(self, api_key: str, model: str, tokens_used: int = 1):
        """Track API usage for billing."""
        self.usage_tracker.track_usage(api_key, model, tokens_used)
    
    def get_usage_stats(self, api_key: str) -> Dict[str, Any]:
        """Get usage statistics for customer portal."""
        subscription = self.get_subscription(api_key)
        usage = self.usage_tracker.get_monthly_usage(api_key)
        
        if not subscription:
            return {"error": "No subscription found"}
            
        tier = subscription["tier"]
        limits = SubscriptionConfig.TIER_LIMITS[tier]
        
        return {
            "subscription": {
                "tier": tier.value,
                "status": subscription["status"],
                "next_billing": subscription["next_billing_date"].isoformat()
            },
            "usage": {
                "current_calls": usage["total_calls"],
                "limit": limits.monthly_api_calls if limits.monthly_api_calls != -1 else "unlimited",
                "percentage_used": (usage["total_calls"] / limits.monthly_api_calls * 100) if limits.monthly_api_calls != -1 else 0,
                "models_used": usage["models_used"],
                "period": usage["period"]
            },
            "features": {
                "available_models": limits.available_models,
                "support_level": limits.support_level,
                "sla_uptime": limits.sla_uptime,
                "custom_models": limits.custom_models,
                "dedicated_support": limits.dedicated_support
            }
        }


# Global subscription manager instance
subscription_manager = SubscriptionManager()

# Initialize some demo subscriptions for testing
subscription_manager.create_subscription("demo_essentials_key", SubscriptionTier.ESSENTIALS, "customer_001")
subscription_manager.create_subscription("demo_pro_key", SubscriptionTier.PROFESSIONAL, "customer_002")  
subscription_manager.create_subscription("demo_enterprise_key", SubscriptionTier.ENTERPRISE, "customer_003")
