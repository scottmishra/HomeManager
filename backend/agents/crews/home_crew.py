"""CrewAI crew definitions for home maintenance agents."""

from crewai import Agent, Crew, Task, Process

from backend.agents.tools.supabase_tools import (
    ListHomesTool,
    GetHomeDetailsTool,
    CreateHomeTool,
    ListAppliancesTool,
    AddApplianceTool,
    ListMaintenanceTasksTool,
    CreateMaintenanceTaskTool,
    CompleteMaintenanceTaskTool,
)
from backend.agents.tools.rag_tools import SearchDocumentsTool


def build_home_profile_agent(user_id: str) -> Agent:
    return Agent(
        role="Home Profile Specialist",
        goal=(
            "Help homeowners set up and manage their home profiles, including "
            "adding homes, appliances, and home details like materials and builder info."
        ),
        backstory=(
            "You are an expert home inspector and organizer. You help homeowners "
            "catalog everything about their home so maintenance can be properly planned. "
            "You ask clear questions to gather home details and appliance information."
        ),
        tools=[
            ListHomesTool(user_id=user_id),
            GetHomeDetailsTool(user_id=user_id),
            CreateHomeTool(user_id=user_id),
            ListAppliancesTool(user_id=user_id),
            AddApplianceTool(user_id=user_id),
        ],
        verbose=True,
        llm="anthropic/claude-sonnet-4-20250514",
    )


def build_schedule_agent(user_id: str) -> Agent:
    return Agent(
        role="Maintenance Schedule Planner",
        goal=(
            "Generate and manage maintenance schedules based on the home's appliances, "
            "location, climate zone, and manufacturer recommendations. Prioritize tasks "
            "that prevent costly damage (e.g., flushing water heaters, HVAC filter changes)."
        ),
        backstory=(
            "You are a seasoned home maintenance planner who has managed maintenance "
            "for thousands of homes across different climates. You know which tasks are "
            "critical vs nice-to-have, and you tailor schedules based on the home's specific "
            "equipment and location. You always explain WHY each task matters."
        ),
        tools=[
            GetHomeDetailsTool(user_id=user_id),
            ListAppliancesTool(user_id=user_id),
            ListMaintenanceTasksTool(user_id=user_id),
            CreateMaintenanceTaskTool(user_id=user_id),
            CompleteMaintenanceTaskTool(user_id=user_id),
        ],
        verbose=True,
        llm="anthropic/claude-sonnet-4-20250514",
    )


def build_howto_agent(user_id: str, home_id: str = "") -> Agent:
    return Agent(
        role="DIY Home Maintenance Guide",
        goal=(
            "Provide step-by-step how-to guides for home maintenance tasks. Include "
            "safety warnings, tool lists, estimated time, difficulty level, and "
            "links to recommended products when relevant."
        ),
        backstory=(
            "You are a master home repair technician and educator with 20+ years of "
            "experience. You can explain complex maintenance procedures in simple terms. "
            "You always prioritize safety and know when a task should be left to professionals."
        ),
        tools=[
            GetHomeDetailsTool(user_id=user_id),
            ListAppliancesTool(user_id=user_id),
            SearchDocumentsTool(user_id=user_id, home_id=home_id),
        ],
        verbose=True,
        llm="anthropic/claude-sonnet-4-20250514",
    )


def build_document_agent(user_id: str, home_id: str = "") -> Agent:
    return Agent(
        role="Document Analyst",
        goal=(
            "Analyze uploaded maintenance documents, manuals, and warranties. "
            "Extract key maintenance schedules, warranty terms, and important procedures. "
            "Answer questions about the documents using RAG search."
        ),
        backstory=(
            "You are a technical document specialist who can quickly parse appliance "
            "manuals, warranty documents, and home inspection reports to extract "
            "actionable maintenance information."
        ),
        tools=[
            SearchDocumentsTool(user_id=user_id, home_id=home_id),
            ListAppliancesTool(user_id=user_id),
        ],
        verbose=True,
        llm="anthropic/claude-sonnet-4-20250514",
    )


def create_home_setup_crew(user_id: str, message: str) -> Crew:
    """Crew for setting up a home profile."""
    agent = build_home_profile_agent(user_id)
    task = Task(
        description=f"User request: {message}",
        expected_output="A summary of the actions taken and the current state of the home profile.",
        agent=agent,
    )
    return Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=True)


def create_schedule_crew(user_id: str, home_id: str, message: str) -> Crew:
    """Crew for generating/managing maintenance schedules."""
    schedule_agent = build_schedule_agent(user_id)
    howto_agent = build_howto_agent(user_id, home_id)

    plan_task = Task(
        description=(
            f"User request: {message}\n\n"
            f"Home ID: {home_id}\n"
            "Review the home's appliances and current tasks, then create or adjust "
            "the maintenance schedule as requested."
        ),
        expected_output=(
            "A maintenance schedule with tasks, frequencies, due dates, and "
            "brief explanations of why each task is important."
        ),
        agent=schedule_agent,
    )

    guide_task = Task(
        description=(
            "For each new maintenance task created, provide a brief how-to summary "
            "including difficulty level and estimated time."
        ),
        expected_output="How-to summaries for each maintenance task.",
        agent=howto_agent,
        context=[plan_task],
    )

    return Crew(
        agents=[schedule_agent, howto_agent],
        tasks=[plan_task, guide_task],
        process=Process.sequential,
        verbose=True,
    )


def create_document_qa_crew(user_id: str, home_id: str, message: str) -> Crew:
    """Crew for answering questions about uploaded documents."""
    agent = build_document_agent(user_id, home_id)
    task = Task(
        description=f"User question: {message}\n\nHome ID: {home_id}",
        expected_output="A detailed answer based on the uploaded documents.",
        agent=agent,
    )
    return Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=True)
