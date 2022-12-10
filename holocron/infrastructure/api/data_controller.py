from typing import Optional

from dependency_injector.wiring import Provide
from fastapi import APIRouter
from pydantic import BaseModel

from holocron.application.data_service import DataService
from holocron.container import ApplicationContainer
from holocron.domain.weapon import default_weapon_categories
from holocron.infrastructure.api.attachment_schema import AttachmentSchema
from holocron.infrastructure.api.gear_schema import GearSchema
from holocron.infrastructure.api.skill_schema import SkillSchema
from holocron.infrastructure.api.talent_schema import TalentSchema
from holocron.infrastructure.database.file.file_repository import Armor

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


@router.get("/rules/", deprecated=True)
async def list_special_rules():
    pass


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class ArmorSchema(OurBaseModel):
    name: str
    description: str
    price: int
    restricted: bool
    rarity: int
    defense: int
    soak: int
    base_mods: list[str]
    models: list[str]
    source: list[str]

    @classmethod
    def from_armor(cls, armor: Armor):
        return cls(name=armor.name,
                   description=armor.description,
                   price=armor.price,
                   restricted=armor.restricted,
                   rarity=armor.rarity,
                   defense=armor.defense,
                   soak=armor.soak,
                   base_mods=armor.base_mods,
                   models=armor.models,
                   source=[str(source) for source in armor.source]
                   )


@router.get("/equipment/weapon")
async def list_weapons(categories: Optional[str] = None):
    categories = categories.split(',') if categories is not None else default_weapon_categories
    return data_service.get_weapon(categories)


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


@router.get("/vehicles/weapons")
async def list_vehicle_weapons():
    return data_service.get_weapon(['vehicle'])
