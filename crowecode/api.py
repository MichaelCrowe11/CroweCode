from __future__ import annotations
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict

from .engine import CroweCodeEngine
from .settings import ConfigManager
from .auth import CroweCodeAuth
from .security import create_rate_limit_dependency
from .validation import CroweCodeRequest, ValidationError
from .admin import admin_router
from .subscriptions import subscription_manager, SubscriptionTier
from .gemma_backend import create_gemma_backend
from .agents_backend import create_agents_backend
from .registry import AgentRegistry


# Initialize security components
auth = CroweCodeAuth()
rate_limit = create_rate_limit_dependency(requests_per_minute=100)

# Initialize Crowe Logic Gemma Intelligence
gemma_backend = create_gemma_backend()
agents_backend = create_agents_backend()

app = FastAPI(
    title="Crowe Logic API", 
    version="3.0",
    description="Crowe Logic - Intelligent Solutions Platform API",
    docs_url="/docs",  # Can be disabled in production
    redoc_url="/redoc"  # Can be disabled in production
)

# Security middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure for production
)

_engine = CroweCodeEngine()
_config = ConfigManager()

# Include admin routes
app.include_router(admin_router)


@app.get("/health")
async def health_check():
    """Health check endpoint (no auth required)."""
    return {
        "status": "healthy",
    # Keep legacy name for compatibility with existing tests
    "service": "CroweCode API",
        "version": "3.0",
    "tagline": "Logic. Applied."
    }


# ========================================
# AGENT REGISTRY ENDPOINTS
# ========================================

@app.get("/crowe-logic/agents")
async def list_agents(
    division: str | None = None,
    expertise: str | None = None,
    _: bool = Depends(auth.require_api_key),
):
    """List agents in the registry with optional filters."""
    # Refresh registry if stale (safe no-op when fresh)
    try:
        AgentRegistry.refresh_if_stale()
    except Exception:
        pass
    agents = AgentRegistry.list_agents(division_filter=division, expertise_filter=expertise)
    return {"agents": agents, "count": len(agents)}


@app.get("/crowe-logic/agents/status")
async def agents_registry_status(_: bool = Depends(auth.require_api_key)):
    """Registry status for observability (source, timestamps, count)."""
    try:
        status = AgentRegistry.status()
    except Exception:
        status = {"error": "unavailable"}
    return status


@app.get("/crowe-logic/agents/{agent_id}")
async def get_agent(agent_id: str, _: bool = Depends(auth.require_api_key)):
    """Get a single agent by ID."""
    try:
        AgentRegistry.refresh_if_stale()
    except Exception:
        pass
    profile = AgentRegistry.get(agent_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Agent not found")
    return profile.public_dict()


@app.post("/crowe-logic/agents/reload")
async def reload_agents(_: bool = Depends(auth.require_api_key)):
    """Reload the agent registry from S3 (if configured) and local YAML.

    Set CROWECODE_AGENTS_S3_URL=s3://<bucket>/<path>/agents.yaml to fetch from S3.
    """
    from_time_cloud = False
    cloud_path = None
    try:
        cloud_path = AgentRegistry.load_from_cloud_if_configured()
        from_time_cloud = bool(cloud_path)
    except Exception:
        pass

    # Always (re)load from YAML afterward
    try:
        count = AgentRegistry.load_from_yaml()
    except Exception:
        count = 0
    return {
        "reloaded": True,
        "loaded_from_cloud": from_time_cloud,
        "cloud_path": cloud_path,
        "count": len(AgentRegistry.list_agents()),
    }




@app.post("/crowecode/generate")
async def generate(
    request: CroweCodeRequest,
    _: bool = Depends(auth.require_api_key),
    __: bool = Depends(rate_limit)
):
    """Generate response using CroweCode models (requires authentication)."""
    try:
        result = _engine.process_request(
            request.prompt, 
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        return result
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/crowecode/models")
async def list_models(_: bool = Depends(auth.require_api_key)):
    """List available CroweCode models (requires authentication)."""
    cfg = _config.list_public_models()
    models = []
    for k, v in cfg.items():
        models.append({
            "id": k,
            "name": v.get("display_name", k.replace("-", " ").title()),
            "description": v.get("description", "CroweCode model"),
            "capabilities": v.get("capabilities", [])
        })
    return {"models": models}


# ========================================
# NEW CROWE LOGIC API ENDPOINTS
# ========================================

@app.post("/crowe-logic/intelligence")
async def intelligence_generate(
    request: CroweCodeRequest,
    api_key_info: dict = Depends(auth.require_api_key),
    __: bool = Depends(rate_limit)
):
    """Generate intelligent responses using Crowe Logic models (requires authentication)."""
    api_key = api_key_info.get("api_key", "unknown")
    
    # Validate subscription and usage limits
    if not subscription_manager.validate_usage_limit(api_key):
        raise HTTPException(
            status_code=429, 
            detail="Monthly usage limit exceeded. Please upgrade your subscription."
        )
    
    # Validate model access based on subscription tier
    if not subscription_manager.validate_model_access(api_key, request.model):
        raise HTTPException(
            status_code=403,
            detail=f"Model {request.model} not available in your subscription tier. Please upgrade."
        )
    
    try:
        result = _engine.process_request(
            request.prompt, 
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        # Track usage for billing
        subscription_manager.track_api_usage(api_key, request.model)
        
        # Add Crowe Logic branding to response
        result["provider"] = "Crowe Logic"
        result["tagline"] = "Logic. Applied."
        result["usage_tracked"] = True
        
        return result
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/crowe-logic/models")
async def list_intelligence_models(_: bool = Depends(auth.require_api_key)):
    """List available Crowe Logic Intelligence Models (requires authentication)."""
    cfg = _config.list_public_models()
    
    # Map CroweCode models to Crowe Logic Intelligence Models
    model_mapping = {
        "crowecode-alpha": {
            "id": "crowe-logic-analytics",
            "name": "Crowe Logic Analytics",
            "description": "Advanced data analysis and business intelligence",
            "capabilities": ["data_analysis", "visualization", "reporting", "insights"],
            "tier_required": "essentials"
        },
        "crowecode-beta": {
            "id": "crowe-logic-development", 
            "name": "Crowe Logic Development",
            "description": "Intelligent software development and coding assistance",
            "capabilities": ["code_generation", "debugging", "optimization", "testing"],
            "tier_required": "essentials"
        },
        "crowecode-gamma": {
            "id": "crowe-logic-creative",
            "name": "Crowe Logic Creative", 
            "description": "Creative content generation and marketing intelligence",
            "capabilities": ["content_creation", "marketing", "design", "branding"],
            "tier_required": "professional"
        },
        "crowecode-delta": {
            "id": "crowe-logic-intelligence",
            "name": "Crowe Logic Intelligence",
            "description": "General-purpose business intelligence and decision support", 
            "capabilities": ["reasoning", "decision_support", "strategy", "analysis"],
            "tier_required": "professional"
        },
        "crowecode-epsilon": {
            "id": "crowe-logic-assistant",
            "name": "Crowe Logic Assistant",
            "description": "Intelligent personal and business assistant",
            "capabilities": ["assistance", "productivity", "scheduling", "communication"],
            "tier_required": "freemium"
        },
        "crowecode-zeta": {
            "id": "crowe-logic-global", 
            "name": "Crowe Logic Global",
            "description": "Multi-language and international business intelligence",
            "capabilities": ["translation", "global_insights", "cultural_analysis", "localization"],
            "tier_required": "enterprise"
        },
        "crowecode-eta": {
            "id": "crowe-logic-research",
            "name": "Crowe Logic Research",
            "description": "Advanced research and knowledge discovery",
            "capabilities": ["research", "knowledge_extraction", "synthesis", "discovery"],
            "tier_required": "professional"
        },
        "crowecode-theta": {
            "id": "crowe-logic-custom",
            "name": "Crowe Logic Custom", 
            "description": "Customizable intelligence for specific business needs",
            "capabilities": ["custom_training", "domain_specific", "enterprise", "specialized"],
            "tier_required": "enterprise"
        }
    }
    
    models = []
    for k, v in cfg.items():
        if k in model_mapping:
            models.append(model_mapping[k])
        else:
            # Fallback for unmapped models
            models.append({
                "id": k.replace("crowecode", "crowe-logic"),
                "name": v.get("display_name", k.replace("-", " ").title()).replace("CroweCode", "Crowe Logic"),
                "description": v.get("description", "Crowe Logic Intelligence Model"),
                "capabilities": v.get("capabilities", ["intelligence", "analysis"]),
                "tier_required": "professional"
            })
    
    # Add Crowe Logic Gemma Intelligence (Premium Model)
    gemma_info = gemma_backend.get_model_info()
    models.append({
        "id": gemma_info["model_id"],
        "name": gemma_info["display_name"],
        "description": gemma_info["description"],
        "capabilities": gemma_info["capabilities"],
        "tier_required": "enterprise",
        "premium": True,
        "pricing_multiplier": 2.0,
        "specialized_endpoints": [
            "/crowe-logic/gemma",
            "/crowe-logic/gemma/analyze"
        ],
        "enterprise_features": gemma_info["enterprise_features"]
    })
    # Add Crowe Logic Agent (Strands)
    agent_info = agents_backend.get_model_info()
    models.append({
        "id": agent_info["model_id"],
        "name": agent_info["display_name"],
        "description": agent_info["description"],
        "capabilities": agent_info["capabilities"],
        "tier_required": "professional",
        "premium": False,
        "specialized_endpoints": [
            "/crowe-logic/agent",
        ],
        "mock_mode": agent_info.get("mock_mode", True),
    })
    
    return {
        "models": models,
        "platform": "Crowe Logic",
        "tagline": "Logic. Applied.",
        "total_models": len(models),
        "premium_models": len([m for m in models if m.get("premium", False)]),
        "enterprise_exclusive": len([m for m in models if m.get("tier_required") == "enterprise"])
    }


@app.get("/crowe-logic/status")
async def platform_status(_: bool = Depends(auth.require_api_key)):
    """Get Crowe Logic platform status and metrics."""
    return {
        "platform": "Crowe Logic",
        "tagline": "Logic. Applied.",
        "status": "operational",
        "uptime": "99.97%",
    "active_models": 9,
        "api_version": "3.0",
        "intelligence_capabilities": [
            "Analytics & Business Intelligence",
            "Software Development & Engineering", 
            "Creative Content & Marketing",
            "General Intelligence & Decision Support",
            "Personal & Business Assistance",
            "Global & Multi-language Intelligence",
            "Research & Knowledge Discovery",
            "Custom & Enterprise Solutions"
        ]
    }


# ========================================
# SUBSCRIPTION MANAGEMENT ENDPOINTS
# ========================================

@app.get("/crowe-logic/subscription")
async def get_subscription_info(api_key_info: dict = Depends(auth.require_api_key)):
    """Get current subscription information and usage statistics."""
    api_key = api_key_info.get("api_key", "unknown")
    
    subscription_info = subscription_manager.get_usage_stats(api_key)
    if "error" in subscription_info:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {
        "platform": "Crowe Logic",
        "tagline": "Logic. Applied.",
        **subscription_info
    }


@app.get("/crowe-logic/pricing")
async def get_pricing_tiers():
    """Get available subscription tiers and pricing information."""
    from .subscriptions import SubscriptionConfig
    
    tiers = []
    for tier, limits in SubscriptionConfig.TIER_LIMITS.items():
        price = SubscriptionConfig.TIER_PRICING[tier]
        
        tiers.append({
            "tier": tier.value,
            "name": tier.value.replace("_", " ").title(),
            "price_monthly": price,
            "features": {
                "monthly_api_calls": limits.monthly_api_calls if limits.monthly_api_calls != -1 else "unlimited",
                "available_models": len(limits.available_models),
                "model_names": limits.available_models,
                "support_level": limits.support_level,
                "sla_uptime": limits.sla_uptime,
                "custom_models": limits.custom_models,
                "priority_support": limits.priority_support,
                "dedicated_support": limits.dedicated_support,
                "white_glove_onboarding": limits.white_glove_onboarding
            }
        })
    
    return {
        "platform": "Crowe Logic",
        "tagline": "Logic. Applied.",
        "pricing_tiers": tiers,
        "billing_cycle": "monthly",
        "currency": "USD"
    }


@app.post("/crowe-logic/subscription/upgrade")
async def request_subscription_upgrade(
    new_tier: str,
    api_key_info: dict = Depends(auth.require_api_key)
):
    """Request subscription tier upgrade."""
    api_key = api_key_info.get("api_key", "unknown")
    
    # Validate tier
    try:
        target_tier = SubscriptionTier(new_tier.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    # Get current subscription
    subscription = subscription_manager.get_subscription(api_key)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    current_tier = subscription["tier"]
    
    # Check if it's actually an upgrade
    tier_order = [
        SubscriptionTier.FREEMIUM,
        SubscriptionTier.ESSENTIALS, 
        SubscriptionTier.PROFESSIONAL,
        SubscriptionTier.ENTERPRISE,
        SubscriptionTier.ENTERPRISE_PLUS
    ]
    
    if tier_order.index(target_tier) <= tier_order.index(current_tier):
        raise HTTPException(status_code=400, detail="Please contact support for downgrades or same-tier changes")
    
    return {
        "platform": "Crowe Logic",
        "tagline": "Logic. Applied.",
        "message": f"Upgrade request from {current_tier.value} to {target_tier.value} received",
        "current_tier": current_tier.value,
        "requested_tier": target_tier.value,
        "status": "pending_payment",
        "contact_sales": "For Enterprise tiers, our sales team will contact you within 24 hours",
        "next_steps": "You will receive an email with payment instructions and upgrade timeline"
    }


# ========================================
# CROWE LOGIC GEMMA INTELLIGENCE ENDPOINTS
# ========================================

@app.post("/crowe-logic/gemma")
async def gemma_intelligence(
    request: CroweCodeRequest,
    api_key_info: dict = Depends(auth.require_api_key),
    __: bool = Depends(rate_limit)
):
    """
    Access Crowe Logic Gemma Intelligence - Premium reasoning and language understanding.
    
    Requires Enterprise or Enterprise Plus subscription.
    """
    api_key = api_key_info.get("api_key", "unknown")
    
    # Validate subscription tier for Gemma access
    subscription = subscription_manager.get_subscription(api_key)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription_tier = subscription["tier"].value
    
    if not gemma_backend.validate_access(subscription_tier):
        raise HTTPException(
            status_code=403,
            detail="Crowe Logic Gemma Intelligence requires Enterprise or Enterprise Plus subscription. Please upgrade."
        )
    
    # Validate usage limits
    if not subscription_manager.validate_usage_limit(api_key):
        raise HTTPException(
            status_code=429,
            detail="Monthly usage limit exceeded. Please upgrade your subscription."
        )
    
    try:
        # Generate response using Gemma Intelligence
        result = gemma_backend.generate_response(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        # Track usage for premium billing
        usage_metadata = result.get("usage_metadata", {})
        input_tokens = usage_metadata.get("input_tokens", 1)
        output_tokens = usage_metadata.get("output_tokens", 1)
        
        subscription_manager.track_api_usage(api_key, "crowe-logic-gemma-intelligence", 
                                           tokens_used=input_tokens + output_tokens)
        
        # Add billing information
        cost_info = gemma_backend.get_usage_cost(input_tokens, output_tokens)
        result["billing"] = cost_info
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemma Intelligence error: {str(e)}")


@app.get("/crowe-logic/gemma/info")
async def gemma_model_info(api_key_info: dict = Depends(auth.require_api_key)):
    """Get detailed information about Crowe Logic Gemma Intelligence."""
    api_key = api_key_info.get("api_key", "unknown")
    
    # Check subscription for detailed info access
    subscription = subscription_manager.get_subscription(api_key)
    subscription_tier = subscription["tier"].value if subscription else "freemium"
    
    model_info = gemma_backend.get_model_info()
    
    # Add access information
    has_access = gemma_backend.validate_access(subscription_tier)
    model_info["access_info"] = {
        "has_access": has_access,
        "current_tier": subscription_tier,
        "required_tiers": ["enterprise", "enterprise_plus"],
        "upgrade_message": "Upgrade to Enterprise for access to Gemma Intelligence" if not has_access else None
    }
    
    return model_info


@app.post("/crowe-logic/gemma/analyze")
async def gemma_logical_analysis(
    request: CroweCodeRequest,
    api_key_info: dict = Depends(auth.require_api_key),
    __: bool = Depends(rate_limit)
):
    """
    Specialized logical analysis endpoint using Crowe Logic Gemma Intelligence.
    
    Optimized for complex reasoning, strategic analysis, and logical problem-solving.
    """
    api_key = api_key_info.get("api_key", "unknown")
    
    # Enterprise access validation
    subscription = subscription_manager.get_subscription(api_key)
    if not subscription or not gemma_backend.validate_access(subscription["tier"].value):
        raise HTTPException(
            status_code=403,
            detail="Logical Analysis requires Enterprise subscription with Gemma Intelligence access"
        )
    
    try:
        # Enhance prompt for logical analysis
        analysis_prompt = f"""
        LOGICAL ANALYSIS REQUEST:
        
        Task: Provide systematic logical analysis of the following:
        {request.prompt}
        
        Please structure your response with:
        1. Problem Definition
        2. Key Variables & Assumptions
        3. Logical Framework
        4. Step-by-Step Reasoning
        5. Conclusions & Recommendations
        6. Confidence Assessment
        
        Apply rigorous logical principles and show your reasoning process.
        """
        
        # Generate specialized logical analysis
        result = gemma_backend.generate_response(
            prompt=analysis_prompt,
            max_tokens=request.max_tokens or 750,  # Higher default for analysis
            temperature=request.temperature or 0.3  # Lower temperature for consistency
        )
        
        # Add analysis metadata
        result["analysis_type"] = "logical_reasoning"
        result["specialized_endpoint"] = "gemma_logical_analysis"
        result["enhanced_reasoning"] = True
        
        # Track premium usage
        usage_metadata = result.get("usage_metadata", {})
        subscription_manager.track_api_usage(
            api_key, 
            "crowe-logic-gemma-analysis", 
            tokens_used=usage_metadata.get("input_tokens", 0) + usage_metadata.get("output_tokens", 0)
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logical Analysis error: {str(e)}")


# ========================================
# CROWE LOGIC STRANDS AGENT ENDPOINT
# ========================================

class AgentRequest(BaseModel):
    prompt: str = Field(..., description="User prompt for the agent")


@app.post("/crowe-logic/agent")
async def run_crowe_logic_agent(
    request: AgentRequest,
    __: bool = Depends(auth.require_api_key),
    ___: bool = Depends(rate_limit),
    raw_request: Request = None,
):
    """
    Execute an agentic workflow powered by Strands Agents.
    Available from Professional tier and above.
    """
    # Extract API key from Authorization header
    api_key = "unknown"
    try:
        auth_header = raw_request.headers.get("authorization") if raw_request else None
        if auth_header and auth_header.lower().startswith("bearer "):
            api_key = auth_header.split(" ", 1)[1].strip()
    except Exception:
        pass

    # Validate subscription tier for agent access
    subscription = subscription_manager.get_subscription(api_key)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Professional and above
    if subscription["tier"] not in [
        SubscriptionTier.PROFESSIONAL,
        SubscriptionTier.ENTERPRISE,
        SubscriptionTier.ENTERPRISE_PLUS,
    ]:
        raise HTTPException(
            status_code=403,
            detail="Agent access requires Professional tier or higher. Please upgrade.",
        )

    # Validate usage limit
    if not subscription_manager.validate_usage_limit(api_key):
        raise HTTPException(
            status_code=429,
            detail="Monthly usage limit exceeded. Please upgrade your subscription.",
        )

    # Run agent
    result = agents_backend.run(request.prompt)

    # Track usage (approximate tokens)
    usage = result.get("usage_metadata", {}) if isinstance(result, dict) else {}
    tokens_used = int(usage.get("input_tokens", 1)) + int(usage.get("output_tokens", 1))
    subscription_manager.track_api_usage(api_key, "crowe-logic-agent", tokens_used=tokens_used)

    # Return structured result
    if isinstance(result, dict):
        return result
    return {
        "provider": "Crowe Logic",
        "model": "crowe-logic-agent",
        "response": str(result),
        "mock": True,
    }


# ========================================
# RUN A SPECIFIC AGENT BY ID (Mock-Full Agent Base)
# ========================================

class AgentTextRunRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt to run against the agent")
    analysis_type: str | None = Field(default="general")
    depth: int | None = Field(default=3, ge=1, le=5)


@app.post("/crowe-logic/agents/{agent_id}/run")
async def run_specific_agent(
    agent_id: str,
    request: AgentTextRunRequest,
    __: bool = Depends(auth.require_api_key),
    ___: bool = Depends(rate_limit),
    raw_request: Request = None,
):
    """Run a specific Crowe Logic agent by ID (mock-first flow)."""
    # Extract API key from Authorization header
    api_key = "unknown"
    try:
        auth_header = raw_request.headers.get("authorization") if raw_request else None
        if auth_header and auth_header.lower().startswith("bearer "):
            api_key = auth_header.split(" ", 1)[1].strip()
    except Exception:
        pass

    # Validate subscription tier (Professional+)
    subscription = subscription_manager.get_subscription(api_key)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if subscription["tier"] not in [
        SubscriptionTier.PROFESSIONAL,
        SubscriptionTier.ENTERPRISE,
        SubscriptionTier.ENTERPRISE_PLUS,
    ]:
        raise HTTPException(
            status_code=403,
            detail="Agent run requires Professional tier or higher. Please upgrade.",
        )
    if not subscription_manager.validate_usage_limit(api_key):
        raise HTTPException(
            status_code=429, detail="Monthly usage limit exceeded. Please upgrade your subscription."
        )

    # Map agent_id -> implementation (expand as roster grows)
    agent_instance = None
    if agent_id == "CL-001":
        try:
            from agents.executive.marcus_chen_wei_complete import MarcusChenWei

            agent_instance = MarcusChenWei()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize agent {agent_id}: {e}")
    else:
        raise HTTPException(status_code=501, detail=f"Agent {agent_id} is not yet implemented")

    # Perform a lightweight deep analysis as a mock "run"
    try:
        depth = max(1, min(5, int(request.depth or 3)))
        # prefer internal analysis method to avoid tool runtime coupling
        if hasattr(agent_instance, "analyze_internal"):
            analysis = await agent_instance.analyze_internal(
                data={"prompt": request.prompt},
                analysis_type=request.analysis_type or "general",
                depth=depth,
            )
        else:
            analysis = await agent_instance.deep_analysis(
                data={"prompt": request.prompt}, analysis_type=request.analysis_type or "general", depth=depth
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent run failed: {e}")

    # Track usage (approximate)
    tokens_used = 50 + 25 * (depth - 1)
    subscription_manager.track_api_usage(api_key, f"agent-run-{agent_id}", tokens_used=tokens_used)

    # Build response
    profile = getattr(agent_instance, "profile", {})
    voice = getattr(agent_instance, "voice_engine", None)
    voice_info = None
    if voice is not None:
        voice_info = {
            "voice_id": getattr(voice, "voice_id", None),
            "style": getattr(voice, "style", None),
        }

    return {
        "provider": "Crowe Logic",
        "agent_id": agent_id,
        "agent_name": getattr(profile, "name", agent_id),
        "division": getattr(profile, "division", None),
        "response": {
            "text": analysis.get("synthesis", {}).get("summary", ""),
            "details": analysis,
        },
        "voice": voice_info,
        "mock_mode": True,
    }
