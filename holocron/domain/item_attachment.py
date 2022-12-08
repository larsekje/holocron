from dataclasses import dataclass
from typing import Optional

from holocron.domain.source import Source

import dataclasses, json


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

    @classmethod
    def from_oggdude(cls, content):
        key = content['Key'] if 'Key' in content else None
        desc = content['MiscDesc'] if 'MiscDesc' in content else None
        count = int(content['Count']) if 'Count' in content else 0

        return cls(count, key, desc)


def get_mods(foo: dict) -> list[Mod]:
    if 'AddedMods' in foo:
        added_mods = foo['AddedMods']['Mod']
        if isinstance(added_mods, list):
            return [Mod.from_oggdude(source) for source in added_mods]
        elif isinstance(added_mods, dict):
            return [Mod.from_oggdude(added_mods)]

    return []


@dataclass
class ItemAttachment:
    name: str
    description: str
    models: list[str]
    type: str
    key: str
    hp: int
    rarity: int
    price: int
    added_mods: list[Mod]
    encumbrance: int
    restricted: bool
    source: Optional[list[Source]] = None

    def __repr__(self):
        return f"{self.key} - '{self.name}' - {self.source}\n\t{', '.join(self.added_mods)}."