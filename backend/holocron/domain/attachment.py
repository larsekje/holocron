import dataclasses
import json
from dataclasses import dataclass
from typing import Optional

from holocron.domain.source import Source


class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        return super().default(o)


@dataclass
class Mod:
    count: int
    key: str
    misc_desc: int


@dataclass
class Attachment:
    name: str
    description: str
    models: list[str]
    type: str
    key: str
    hp: int
    rarity: int
    price: int
    base_mods: list[str]
    added_mods: list[str]
    encumbrance: int
    restricted: bool
    source: Optional[list[Source]] = None

    # def __repr__(self):
    #     return f"{self.key} - '{self.name}' - {self.source}\n\t{', '.join(self.added_mods)}."
