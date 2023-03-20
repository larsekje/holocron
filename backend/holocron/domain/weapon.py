from dataclasses import dataclass
from typing import Optional

from holocron.domain.source import Source


@dataclass
class Weapon:
    name: str
    description: str
    models: list[str]
    type: str
    key: str
    hp: int
    rarity: int
    price: int
    base_mods: list[str]
    encumbrance: int
    damage: int
    plus_damage: bool
    crit: int
    range: str
    skill: str
    qualities: list[str]
    restricted: bool
    source: Optional[list[Source]] = None


default_weapon_categories = [
  "energy weapon",
  "brawling",
  "melee",
  "tool",
  "lightsaber",
  "slugthrower",
  "thrown",
  "explosives/other"
]