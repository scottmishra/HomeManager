from enum import Enum

from pydantic import BaseModel, Field


class AgentAction(str, Enum):
    """All actions that can be triggered by or routed to agents."""
    # Home profile
    SETUP_HOME = "setup_home"
    UPDATE_HOME = "update_home"

    # Appliances
    ADD_APPLIANCE = "add_appliance"
    IDENTIFY_APPLIANCE = "identify_appliance"

    # Scheduling
    GENERATE_SCHEDULE = "generate_schedule"
    ADJUST_SCHEDULE = "adjust_schedule"

    # Guides
    GET_HOW_TO = "get_how_to"
    GET_PRODUCT_RECOMMENDATION = "get_product_recommendation"

    # Documents / RAG
    PROCESS_DOCUMENT = "process_document"
    ASK_DOCUMENT = "ask_document"

    # Contractor
    FIND_CONTRACTOR = "find_contractor"

    # General
    CHAT = "chat"


class AgentRequest(BaseModel):
    """Universal request model for all agent interactions."""
    action: AgentAction
    message: str = Field(..., description="Natural language message from the user")
    home_id: str | None = None
    context: dict | None = Field(default=None, description="Additional structured context")


class AgentResponse(BaseModel):
    """Universal response model from agents."""
    action: AgentAction
    message: str = Field(..., description="Natural language response to the user")
    data: dict | None = Field(default=None, description="Structured data returned by the agent")
    suggested_actions: list[AgentAction] | None = Field(
        default=None, description="Follow-up actions the user might want to take"
    )
