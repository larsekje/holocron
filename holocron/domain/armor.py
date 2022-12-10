from dataclasses import dataclass

from holocron.domain.source import Source


@dataclass
class Armor:
    name: str
    description: str
    defense: int
    soak: int
    price: int
    restricted: bool
    rarity: int
    base_mods: list[str]
    models: list[str]
    source: list[Source]
