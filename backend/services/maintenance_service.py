from backend.core.supabase_client import get_supabase
from backend.models.maintenance import MaintenanceTaskCreate, MaintenanceTaskUpdate


class MaintenanceService:
    """Service layer for maintenance task CRUD. Agent-ready."""

    def __init__(self):
        self.supabase = get_supabase()
        self.table = "maintenance_tasks"

    def create_task(self, user_id: str, task: MaintenanceTaskCreate) -> dict:
        data = task.model_dump(exclude_none=True)
        data["user_id"] = user_id
        if "due_date" in data and data["due_date"] is not None:
            data["due_date"] = str(data["due_date"])
        result = self.supabase.table(self.table).insert(data).execute()
        return result.data[0] if result.data else {}

    def get_task(self, task_id: str, user_id: str) -> dict | None:
        result = (
            self.supabase.table(self.table)
            .select("*")
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list_tasks(
        self,
        home_id: str,
        user_id: str,
        status: str | None = None,
    ) -> list[dict]:
        query = (
            self.supabase.table(self.table)
            .select("*")
            .eq("home_id", home_id)
            .eq("user_id", user_id)
        )
        if status:
            query = query.eq("status", status)
        result = query.order("due_date").execute()
        return result.data or []

    def update_task(
        self, task_id: str, user_id: str, task: MaintenanceTaskUpdate
    ) -> dict | None:
        data = task.model_dump(exclude_none=True)
        if not data:
            return self.get_task(task_id, user_id)
        for key in ("due_date", "completed_date"):
            if key in data and data[key] is not None:
                data[key] = str(data[key])
        result = (
            self.supabase.table(self.table)
            .update(data)
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def complete_task(self, task_id: str, user_id: str, notes: str | None = None) -> dict | None:
        from datetime import date

        data: dict = {"status": "completed", "completed_date": str(date.today())}
        if notes:
            data["completion_notes"] = notes
        result = (
            self.supabase.table(self.table)
            .update(data)
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def delete_task(self, task_id: str, user_id: str) -> bool:
        result = (
            self.supabase.table(self.table)
            .delete()
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(result.data)

    def get_upcoming_tasks(self, user_id: str, days: int = 7) -> list[dict]:
        from datetime import date, timedelta

        end_date = str(date.today() + timedelta(days=days))
        result = (
            self.supabase.table(self.table)
            .select("*, homes(name), appliances(name)")
            .eq("user_id", user_id)
            .in_("status", ["pending", "upcoming"])
            .lte("due_date", end_date)
            .order("due_date")
            .execute()
        )
        return result.data or []
