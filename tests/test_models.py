"""Basic model validation tests."""

from backend.models.home import HomeCreate, HomeType
from backend.models.appliance import ApplianceCreate, ApplianceCategory
from backend.models.maintenance import MaintenanceTaskCreate, TaskFrequency, TaskPriority
from backend.models.agent_models import AgentRequest, AgentAction


def test_home_create():
    home = HomeCreate(name="My House", city="Austin", state="TX", year_built=2020)
    assert home.name == "My House"
    assert home.home_type == HomeType.SINGLE_FAMILY


def test_appliance_create():
    appliance = ApplianceCreate(
        home_id="test-home-id",
        name="Dishwasher",
        brand="Bosch",
        category=ApplianceCategory.KITCHEN,
    )
    assert appliance.name == "Dishwasher"
    assert appliance.category == ApplianceCategory.KITCHEN


def test_maintenance_task_create():
    task = MaintenanceTaskCreate(
        home_id="test-home-id",
        title="Flush Water Heater",
        frequency=TaskFrequency.ANNUAL,
        priority=TaskPriority.HIGH,
    )
    assert task.title == "Flush Water Heater"
    assert task.frequency == TaskFrequency.ANNUAL


def test_agent_request():
    req = AgentRequest(
        action=AgentAction.CHAT,
        message="How do I clean my dryer vent?",
        home_id="test-home-id",
    )
    assert req.action == AgentAction.CHAT
    assert "dryer" in req.message
