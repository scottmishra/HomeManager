"""Central orchestrator that routes agent requests to the appropriate CrewAI crews."""

import logging

from fastapi import UploadFile

from backend.models.agent_models import AgentAction, AgentRequest, AgentResponse
from backend.agents.crews.home_crew import (
    create_home_setup_crew,
    create_schedule_crew,
    create_document_qa_crew,
)

logger = logging.getLogger(__name__)

# Map actions to their handler methods
_HOME_ACTIONS = {AgentAction.SETUP_HOME, AgentAction.UPDATE_HOME}
_APPLIANCE_ACTIONS = {AgentAction.ADD_APPLIANCE, AgentAction.IDENTIFY_APPLIANCE}
_SCHEDULE_ACTIONS = {AgentAction.GENERATE_SCHEDULE, AgentAction.ADJUST_SCHEDULE}
_GUIDE_ACTIONS = {AgentAction.GET_HOW_TO, AgentAction.GET_PRODUCT_RECOMMENDATION}
_DOCUMENT_ACTIONS = {AgentAction.PROCESS_DOCUMENT, AgentAction.ASK_DOCUMENT}


class AgentOrchestrator:
    """Routes requests to the appropriate CrewAI crew based on the action type."""

    def __init__(self, user_id: str):
        self.user_id = user_id

    async def handle(self, request: AgentRequest) -> AgentResponse:
        action = request.action
        home_id = request.home_id or ""
        message = request.message

        try:
            if action in _HOME_ACTIONS or action in _APPLIANCE_ACTIONS:
                crew = create_home_setup_crew(self.user_id, message)
                result = crew.kickoff()
                return AgentResponse(
                    action=action,
                    message=str(result),
                    suggested_actions=[
                        AgentAction.ADD_APPLIANCE,
                        AgentAction.GENERATE_SCHEDULE,
                    ],
                )

            if action in _SCHEDULE_ACTIONS:
                if not home_id:
                    return AgentResponse(
                        action=action,
                        message="Please select a home first to manage its maintenance schedule.",
                        suggested_actions=[AgentAction.SETUP_HOME],
                    )
                crew = create_schedule_crew(self.user_id, home_id, message)
                result = crew.kickoff()
                return AgentResponse(
                    action=action,
                    message=str(result),
                    suggested_actions=[AgentAction.GET_HOW_TO],
                )

            if action in _GUIDE_ACTIONS:
                crew = create_document_qa_crew(self.user_id, home_id, message)
                result = crew.kickoff()
                return AgentResponse(
                    action=action,
                    message=str(result),
                    suggested_actions=[AgentAction.GENERATE_SCHEDULE],
                )

            if action in _DOCUMENT_ACTIONS:
                crew = create_document_qa_crew(self.user_id, home_id, message)
                result = crew.kickoff()
                return AgentResponse(
                    action=action,
                    message=str(result),
                    suggested_actions=[AgentAction.ASK_DOCUMENT],
                )

            if action == AgentAction.CHAT:
                # General chat — use the home setup crew as a general assistant
                crew = create_home_setup_crew(self.user_id, message)
                result = crew.kickoff()
                return AgentResponse(action=action, message=str(result))

            return AgentResponse(
                action=action,
                message=f"Action '{action}' is not yet implemented.",
            )

        except Exception as e:
            logger.exception("Agent orchestrator error")
            return AgentResponse(
                action=action,
                message=f"I encountered an error: {str(e)}. Please try again.",
            )

    async def process_document(self, home_id: str, file: UploadFile) -> AgentResponse:
        """Process an uploaded document through the RAG pipeline."""
        from backend.rag.processor import DocumentProcessor

        try:
            processor = DocumentProcessor()
            doc_count = await processor.process_upload(
                file=file,
                user_id=self.user_id,
                home_id=home_id,
            )
            return AgentResponse(
                action=AgentAction.PROCESS_DOCUMENT,
                message=(
                    f"Successfully processed '{file.filename}' into {doc_count} searchable chunks. "
                    "You can now ask questions about this document."
                ),
                suggested_actions=[AgentAction.ASK_DOCUMENT, AgentAction.GENERATE_SCHEDULE],
            )
        except Exception as e:
            logger.exception("Document processing error")
            return AgentResponse(
                action=AgentAction.PROCESS_DOCUMENT,
                message=f"Failed to process document: {str(e)}",
            )
