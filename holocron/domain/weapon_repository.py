from abc import ABC

from holocron.domain.weapon import Weapon


class IWeaponRepository(ABC):

    def get_all(self) -> list[Weapon]:
        ...
