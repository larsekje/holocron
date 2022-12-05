from dataclasses import dataclass

from holocron.domain.weapon import Weapon


@dataclass
class WeaponService:

    def get_all(self):
        a = Weapon("DL-44", 5)
        b = Weapon("Lightsaber", 9)

        return [a, b]
