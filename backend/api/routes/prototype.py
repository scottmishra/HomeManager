"""
Prototype route: POST /api/v1/prototype/chat
Uses Claude Agent SDK (local CLI) — no auth required, dev/evaluation only.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.claude_sdk_service import run_claude_sdk_query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/prototype", tags=["prototype"])


class PrototypeChatRequest(BaseModel):
    message: str = Field(..., description="The user's message")
    system_prompt: str | None = Field(
        default="You are a helpful home maintenance assistant.",
    )


class PrototypeChatResponse(BaseModel):
    message: str
    sdk: str = "claude-agent-sdk"


@router.post("/chat", response_model=PrototypeChatResponse)
async def prototype_chat(request: PrototypeChatRequest):
    """Minimal SDK prototype. Uses local `claude` CLI, bypasses CrewAI and API key."""
    try:
        reply = await run_claude_sdk_query(request.message, request.system_prompt)
        return PrototypeChatResponse(message=reply)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in Claude SDK prototype")
        raise HTTPException(status_code=500, detail=f"SDK error: {exc}")
