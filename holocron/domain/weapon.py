from dataclasses import dataclass
from typing import Optional


@dataclass
class Weapon:
    name: str
    skill: str
    damage: int
    critical: int
    range: str
    qualities: Optional[list[str]] = None
    notes: Optional[str] = None

    @classmethod
    def create_from_json(cls, json: dict) -> "Weapon":
        return cls(*json.values())


