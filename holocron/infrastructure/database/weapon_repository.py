import json
import logging
import os
from dataclasses import dataclass

from holocron.domain.weapon import Weapon
from holocron.domain.weapon_repository import IWeaponRepository
from holocron.definitions import DATA_PATH

@dataclass
class WeaponFileRepository(IWeaponRepository):

    logger = logging.getLogger(__name__)

    def get_all(self) -> list[Weapon]:
        self.logger.info("Get all weapons")
        weapons: list[Weapon] = []

        with open(os.path.join(DATA_PATH, 'weapons.json'), encoding='utf8') as f:
            for foo in json.load(f):
                self.logger.debug("Parsing weapon %s", foo)
                weapon = Weapon.create_from_json(foo)
                weapons.append(weapon)
                self.logger.debug("Parsed weapon %s", weapon)

        return weapons


if __name__ == '__main__':
    foo = WeaponFileRepository(DATA_PATH)
    weapons = foo.get_all()

    print(*weapons, sep='\n')


