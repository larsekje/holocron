from dataclasses import asdict

from dependency_injector.wiring import Provide
from fastapi import APIRouter

from holocron.application.data_service import DataService
from holocron.container import ApplicationContainer
from holocron.domain.gear import Gear
from holocron.domain.source import Source
from holocron.infrastructure.api.talent_schema import TalentSchema
from holocron.infrastructure.api.attachment_schema import AttachmentSchema
from holocron.infrastructure.api.skill_schema import SkillSchema

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


@router.get("/force")
async def list_force_powers():
    pass


@router.get("/player/careers")
async def list_careers():
    pass


@router.get("/player/careers/specializations")
async def list_career_specializations():
    pass


@router.get("/player/hooks/")
async def list_hooks():
    """
    Hooks, obligations, duties, moralities and motivations
    """
    pass


@router.get("/rules/", response_model=dict[str, Source])
async def list_special_rules():
    pass


@router.get("/equipment/gear", response_model=list[Gear])
async def list_gear():
    return data_service.get_gear()


@router.get("/equipment/attachments", response_model=list[AttachmentSchema])
async def list_attachments():
    attachments = data_service.get_attachments(['weapon', 'armor'])
    return [AttachmentSchema.from_attachment(attachment) for attachment in attachments]


@router.get("/crafting/templates")
async def list_crafting_templates():
    pass


@router.get("/dice/tables/")
async def list_crafting_templates():
    """
    List tables for spending x, y, a, t on [something]
    """
    pass


@router.get("/adversaries", deprecated=True)
async def list_adversaries(minionsOnly: bool = False, rivalsOnly: bool = False, nemesisOnly: bool = False):
    return "adversaries"


@router.get("/vehicles/", deprecated=True)
async def list_vehicles():
    return "adversaries"


@router.get("/vehicles/modifications", response_model=list[AttachmentSchema])
async def list_vehicle_modifications():
    attachments = data_service.get_attachments(['vehicle'])
    return [AttachmentSchema.from_attachment(attachment) for attachment in attachments]
