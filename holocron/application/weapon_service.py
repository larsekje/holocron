from dataclasses import dataclass

from holocron.domain.weapon_repository import IWeaponRepository


@dataclass
class WeaponService:
    weapon_repository: IWeaponRepository

    def get_all(self):
        return self.weapon_repository.get_all()
