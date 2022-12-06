from dataclasses import asdict

from dependency_injector.wiring import Provide
from fastapi import APIRouter

from holocron.application.weapon_service import WeaponService
from holocron.container import ApplicationContainer
from holocron.infrastructure.api.weapon_schema import WeaponSchema

weapon_service: WeaponService = Provide[ApplicationContainer.weapon_service]

router = APIRouter(
    prefix="/data",
    tags=["data"]
)


@router.get("/talents")
async def list_talents():
    return "talents"


@router.get("/abilities")
async def list_abilities():
    return "abilities"


@router.get("/gear")
async def list_gear():
    return "weapons"


@router.get("/weapons", response_model=list[WeaponSchema])
async def list_weapons():
    weapons = weapon_service.get_all()
    return [WeaponSchema(**asdict(weapon)) for weapon in weapons]


@router.get("/weapon/attachments")
async def list_weapon_attachments():
    return "attachments"


@router.get("/adversaries")
async def list_all_adversaries(minionsOnly: bool = False, rivalsOnly: bool = False, nemesisOnly: bool = False):
    return "adversaries"


@router.get("/adversary/{id}")
async def get_adversary(id: str):
    return "adversaries"


@router.post("/adversary/{id}")
async def add_adversary(id: str):
    return "adversaries"


@router.put("/adversary/{id}")
async def replace_adversary(id: str):
    return "adversaries"


@router.delete("/adversary/{id}")
async def delete_adversary(id: str):
    return "adversary {id} deleted"


@router.get("/starships/")
async def list_starships():
    return "adversaries"


@router.get("/starhips/attachments")
async def list_starship_attachments():
    return "adversaries"
