from typing import Optional

from dependency_injector.wiring import Provide
from fastapi import APIRouter

from holocron.application.data_service import DataService
from holocron.container import ApplicationContainer
from holocron.domain.adversary import AdversarySchema
from holocron.domain.weapon import default_weapon_categories
from holocron.infrastructure.api.armor_schema import ArmorSchema
from holocron.infrastructure.api.attachment_schema import AttachmentSchema
from holocron.infrastructure.api.gear_schema import GearSchema
from holocron.infrastructure.api.skill_schema import SkillSchema
from holocron.infrastructure.api.talent_schema import TalentSchema
from holocron.infrastructure.api.weapon_schema import WeaponSchema

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


@router.get("/force", deprecated=True)
async def list_force_powers():
    pass


@router.get("/player/careers", deprecated=True)
async def list_careers():
    pass


@router.get("/player/careers/specializations", deprecated=True)
async def list_career_specializations():
    pass


@router.get("/player/hooks/", deprecated=True)
async def list_hooks():
    """
    Hooks, obligations, duties, moralities and motivations
    """
    pass


@router.get("/equipment/weapon", response_model=list[WeaponSchema])
async def list_weapons(categories: Optional[str] = None):
    categories = categories.split(',') if categories is not None else default_weapon_categories
    return [WeaponSchema.from_weapon(weapon) for weapon in data_service.get_weapon(categories)]


@router.get("/equipment/weapon/categories")
async def list_weapon_categories():
    return data_service.get_weapon_categories()


@router.get("/equipment/armor", response_model=list[ArmorSchema])
async def list_armor():
    schemas = []
    for armor in data_service.get_armor():
        schemas.append(ArmorSchema.from_armor(armor))

    return schemas


@router.get("/equipment/gear", response_model=list[GearSchema])
async def list_gear(categories: Optional[str] = None):
    categories = categories.split(',') if categories is not None else None
    return [GearSchema.from_gear(gear) for gear in data_service.get_gear(categories)]


@router.get("/equipment/gear/categories", response_model=list[str])
async def list_gear_categories():
    return data_service.get_gear_categories()


@router.get("/equipment/attachments", response_model=list[AttachmentSchema])
async def list_attachments():
    attachments = data_service.get_attachments(['weapon', 'armor'])
    return [AttachmentSchema.from_attachment(attachment) for attachment in attachments]


@router.get("/crafting/templates", deprecated=True)
async def list_crafting_templates():
    pass


@router.get("/dice/tables/", deprecated=True)
async def list_dice_tables():
    """
    List tables for spending x, y, a, t on [something]
    """
    pass


@router.get("/adversaries", response_model=list[AdversarySchema])
async def list_adversaries():
    adversaries = data_service.get_adversaries()
    return [AdversarySchema(adversary) for adversary in adversaries]


@router.get("/vehicles/", deprecated=True)
async def list_vehicles():
    return "adversaries"


@router.get("/vehicles/modifications", response_model=list[AttachmentSchema])
async def list_vehicle_modifications():
    attachments = data_service.get_attachments(['vehicle'])
    return [AttachmentSchema.from_attachment(attachment) for attachment in attachments]


@router.get("/vehicles/weapons", response_model=list[WeaponSchema])
async def list_vehicle_weapons():
    weapons = data_service.get_weapon(['vehicle'])
    return [WeaponSchema.from_weapon(weapon) for weapon in weapons]
