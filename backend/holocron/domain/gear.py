from dataclasses import dataclass


@dataclass
class Gear:
    name: str
    description: str
    type: str
    price: int
    restricted: bool
    rarity: int
    models: list[str]
    source: list[str]

