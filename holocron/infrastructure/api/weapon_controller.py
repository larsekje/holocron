from dataclasses import asdict

from dependency_injector.wiring import Provide
from fastapi import APIRouter

from holocron.application.weapon_service import WeaponService
from holocron.container import ApplicationContainer
from holocron.infrastructure.api.weapon_schema import WeaponSchema

weapon_service: WeaponService = Provide[ApplicationContainer.weapon_service]

router = APIRouter(
    prefix="/weapon",
    tags=["Weapon"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=list[WeaponSchema])
async def list_weapons():
    weapons = weapon_service.get_all()
    return [WeaponSchema(**asdict(weapon)) for weapon in weapons]
