"""CrewAI tools that wrap Supabase operations for agent use."""

from crewai.tools import BaseTool
from pydantic import Field

from backend.services.home_service import HomeService
from backend.services.appliance_service import ApplianceService
from backend.services.maintenance_service import MaintenanceService
from backend.models.home import HomeCreate
from backend.models.appliance import ApplianceCreate
from backend.models.maintenance import MaintenanceTaskCreate


class ListHomesTool(BaseTool):
    name: str = "list_homes"
    description: str = "List all homes for the current user."
    user_id: str = Field(default="")

    def _run(self) -> str:
        service = HomeService()
        homes = service.list_homes(self.user_id)
        if not homes:
            return "No homes found. The user should add a home first."
        lines = []
        for h in homes:
            lines.append(f"- {h['name']} (ID: {h['id']}, {h.get('city', 'N/A')}, "
                         f"{h.get('state', 'N/A')})")
        return "Homes:\n" + "\n".join(lines)


class GetHomeDetailsTool(BaseTool):
    name: str = "get_home_details"
    description: str = "Get detailed info about a specific home. Input: home_id"
    user_id: str = Field(default="")

    def _run(self, home_id: str) -> str:
        service = HomeService()
        home = service.get_home(home_id, self.user_id)
        if not home:
            return f"Home {home_id} not found."
        return str(home)


class CreateHomeTool(BaseTool):
    name: str = "create_home"
    description: str = (
        "Create a new home profile. Input: JSON with at minimum 'name'. "
        "Optional: address, city, state, zip_code, home_type, year_built, "
        "square_footage, builder, num_bedrooms, num_bathrooms."
    )
    user_id: str = Field(default="")

    def _run(self, home_data: str) -> str:
        import json
        data = json.loads(home_data)
        home = HomeCreate(**data)
        service = HomeService()
        result = service.create_home(self.user_id, home)
        return f"Home created: {result.get('name', 'Unknown')} (ID: {result.get('id', 'N/A')})"


class ListAppliancesTool(BaseTool):
    name: str = "list_appliances"
    description: str = "List all appliances for a home. Input: home_id"
    user_id: str = Field(default="")

    def _run(self, home_id: str) -> str:
        service = ApplianceService()
        appliances = service.list_appliances(home_id, self.user_id)
        if not appliances:
            return "No appliances found for this home."
        lines = []
        for a in appliances:
            lines.append(f"- {a['name']} ({a.get('brand', 'N/A')}, "
                         f"Category: {a.get('category', 'N/A')}, ID: {a['id']})")
        return "Appliances:\n" + "\n".join(lines)


class AddApplianceTool(BaseTool):
    name: str = "add_appliance"
    description: str = (
        "Add an appliance to a home. Input: JSON with 'home_id', 'name', and optional: "
        "brand, model_number, serial_number, category, purchase_date, warranty_expiry, "
        "install_date, location_in_home."
    )
    user_id: str = Field(default="")

    def _run(self, appliance_data: str) -> str:
        import json
        data = json.loads(appliance_data)
        appliance = ApplianceCreate(**data)
        service = ApplianceService()
        result = service.create_appliance(self.user_id, appliance)
        return (f"Appliance added: {result.get('name', 'Unknown')} "
                f"(ID: {result.get('id', 'N/A')})")


class ListMaintenanceTasksTool(BaseTool):
    name: str = "list_maintenance_tasks"
    description: str = "List maintenance tasks for a home. Input: home_id"
    user_id: str = Field(default="")

    def _run(self, home_id: str) -> str:
        service = MaintenanceService()
        tasks = service.list_tasks(home_id, self.user_id)
        if not tasks:
            return "No maintenance tasks found for this home."
        lines = []
        for t in tasks:
            lines.append(
                f"- {t['title']} (Status: {t.get('status', 'N/A')}, "
                f"Due: {t.get('due_date', 'N/A')}, Priority: {t.get('priority', 'N/A')}, "
                f"ID: {t['id']})"
            )
        return "Tasks:\n" + "\n".join(lines)


class CreateMaintenanceTaskTool(BaseTool):
    name: str = "create_maintenance_task"
    description: str = (
        "Create a maintenance task. Input: JSON with 'home_id', 'title', and optional: "
        "appliance_id, description, frequency, priority, due_date, "
        "estimated_duration_minutes, estimated_cost."
    )
    user_id: str = Field(default="")

    def _run(self, task_data: str) -> str:
        import json
        data = json.loads(task_data)
        task = MaintenanceTaskCreate(**data)
        service = MaintenanceService()
        result = service.create_task(self.user_id, task)
        return (f"Task created: {result.get('title', 'Unknown')} "
                f"(ID: {result.get('id', 'N/A')})")


class CompleteMaintenanceTaskTool(BaseTool):
    name: str = "complete_maintenance_task"
    description: str = "Mark a maintenance task as complete. Input: task_id"
    user_id: str = Field(default="")

    def _run(self, task_id: str) -> str:
        service = MaintenanceService()
        result = service.complete_task(task_id, self.user_id)
        if not result:
            return f"Task {task_id} not found."
        return f"Task '{result.get('title', '')}' marked as completed."
