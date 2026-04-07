from fastapi import APIRouter, Depends, UploadFile, File

from backend.core.auth import get_current_user
from backend.models.agent_models import AgentRequest, AgentResponse
from backend.agents.orchestrator import AgentOrchestrator

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat", response_model=AgentResponse)
async def agent_chat(
    request: AgentRequest,
    user=Depends(get_current_user),
):
    """Universal agent endpoint. Routes the request to the appropriate CrewAI agent
    based on the action type. All frontend interactions can go through this single endpoint."""
    orchestrator = AgentOrchestrator(user_id=user.id)
    return await orchestrator.handle(request)


@router.post("/document", response_model=AgentResponse)
async def process_document(
    home_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """Upload and process a maintenance document (manual, warranty, etc.) for RAG."""
    orchestrator = AgentOrchestrator(user_id=user.id)
    return await orchestrator.process_document(home_id, file)
