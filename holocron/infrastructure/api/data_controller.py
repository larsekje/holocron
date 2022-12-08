from dataclasses import asdict

from dependency_injector.wiring import Provide
from fastapi import APIRouter

from holocron.application.data_service import DataService
from holocron.application.weapon_service import WeaponService
from holocron.container import ApplicationContainer
from holocron.infrastructure.api.talent_schema import TalentSchema
from holocron.infrastructure.api.attachment_schema import AttachmentSchema
from holocron.infrastructure.api.skill_schema import SkillSchema
from holocron.infrastructure.api.weapon_schema import WeaponSchema

weapon_service: WeaponService = Provide[ApplicationContainer.weapon_service]
data_service: DataService = Provide[ApplicationContainer.data_service]

router = APIRouter(
    prefix="/data",
    tags=["data"]
)


@router.get("/talents", response_model=list[TalentSchema])
async def list_talents():
    return data_service.get_talents_web()


@router.get("/abilities", deprecated=True)
async def list_abilities():
    return "abilities"


@router.get("/skills", response_model=list[SkillSchema])
async def list_skills():
    foo = data_service.get_skills_web()
    return foo


@router.get("/gear", deprecated=True)
async def list_gear():
    return "weapons"


@router.get("/weapons", response_model=list[WeaponSchema])
async def list_weapons():
    weapons = weapon_service.get_all()
    return [WeaponSchema(**asdict(weapon)) for weapon in weapons]


@router.get("/gear/attachments", response_model=list[AttachmentSchema])
async def list_attachments():
    attachments = data_service.get_attachments()
    return [AttachmentSchema.from_attachment(attachment) for attachment in attachments]


@router.get("/adversaries", deprecated=True)
async def list_all_adversaries(minionsOnly: bool = False, rivalsOnly: bool = False, nemesisOnly: bool = False):
    return "adversaries"


@router.get("/adversary/{id}", deprecated=True)
async def get_adversary(id: str):
    return "adversaries"


@router.post("/adversary/{id}", deprecated=True)
async def add_adversary(id: str):
    return "adversaries"


@router.put("/adversary/{id}", deprecated=True)
async def replace_adversary(id: str):
    return "adversaries"


@router.delete("/adversary/{id}", deprecated=True)
async def delete_adversary(id: str):
    return "adversary {id} deleted"


@router.get("/starships/", deprecated=True)
async def list_starships():
    return "adversaries"


@router.get("/starhips/attachments", deprecated=True)
async def list_starship_attachments():
    return "adversaries"
