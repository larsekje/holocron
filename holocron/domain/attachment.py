from dataclasses import dataclass
from typing import Optional


@dataclass
class Attachment:
    name: str
    hp: int
    price: int
    restricted: bool
    rarity: int
    description: Optional[str] = None
    models: Optional[int] = None
    base_modifiers: Optional[int] = None
    options: Optional[str] = None
    encumbrance: Optional[int] = None
    category: Optional[str] = None
    source: Optional[str] = None

    @classmethod
    def create_from_json(cls, json: dict) -> "Attachment":
        return Attachment(json['name'],
                          json['hp'],
                          json['price'],
                          json['restricted'],
                          json['rarity'],
                          )


