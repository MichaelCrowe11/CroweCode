from __future__ import annotations
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict

from .registry import AgentRegistry

# Initialize FastAPI app
app = FastAPI(
    title="Crowe Logic API",
    description="Advanced AI Agent Platform",
    version="2.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

# Initialize components
registry = AgentRegistry()

class RunRequest(BaseModel):
    query: str = Field(..., description="The query to process")
    conversation_id: str = Field(default="", description="Conversation ID for session tracking")
    stream: bool = Field(default=False, description="Whether to stream the response")

@app.get("/")
async def root():
    """Root endpoint returning API information."""
    return {
        "service": "Crowe Logic",
        "version": "2.0.0",
        "description": "Advanced AI Agent Platform",
        "status": "operational",
        "endpoints": {
            "agents": "/crowe-logic/agents",
            "run": "/crowe-logic/agents/{agent_id}/run",
            "status": "/crowe-logic/agents/status",
            "assets": "/crowe-logic/agents/assets/status",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "crowe-logic-api"}

@app.get("/crowe-logic/agents")
async def list_agents():
    """List all available agents."""
    # Refresh registry from cloud if configured
    registry.refresh_if_stale()
    
    agents = registry.list_agents()
    return {"agents": agents}

@app.get("/crowe-logic/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get details for a specific agent."""
    # Refresh registry from cloud if configured
    registry.refresh_if_stale()
    
    agent = registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return {"agent": agent}

@app.get("/crowe-logic/agents/status")
async def get_registry_status():
    """Get status of the agent registry including cloud storage."""
    return registry.status()

@app.get("/crowe-logic/agents/assets/status")
async def get_assets_status():
    """Get status of the agent assets system."""
    return {"status": "disabled", "reason": "Asset manager not configured"}

@app.post("/crowe-logic/agents/{agent_id}/run")
async def run_agent(agent_id: str, request: RunRequest):
    """Run an agent with the provided query."""
    # Refresh registry from cloud if configured
    registry.refresh_if_stale()
    
    # Load agent assets (prompts, voices, knowledge) - disabled for now
    # asset_manager = get_asset_manager()
    # agent_assets = await asset_manager.get_agent_assets(agent_id)
    agent_assets = None
    
    # Get agent configuration
    agent_config = registry.get_agent(agent_id)
    if not agent_config:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    # Import and instantiate the agent
    try:
        if agent_id == "marcus_chen_wei":
            from agents.executive.marcus_chen_wei_complete import MarcusChenWei
            # Pass custom prompt if available from S3 assets
            custom_prompt = agent_assets.custom_prompt if agent_assets else None
            agent = MarcusChenWei(custom_prompt=custom_prompt)
        else:
            raise HTTPException(status_code=501, detail=f"Agent '{agent_id}' implementation not available")
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Failed to import agent '{agent_id}': {str(e)}")
    
    # Mock implementation for demonstration
    return {
        "provider": "Crowe Logic",
        "agent_id": agent_id,
        "agent_name": getattr(agent.profile, "name", agent_id),
        "division": getattr(agent.profile, "division", None),
        "response": {
            "text": f"Mock response from {agent_id} for query: {request.query}",
            "details": {"query": request.query, "conversation_id": request.conversation_id},
        },
        "assets_loaded": False,
        "custom_prompt_used": False,
        "mock_mode": True,
    }
