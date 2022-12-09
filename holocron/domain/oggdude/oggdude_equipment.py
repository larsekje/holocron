from abc import ABC
from dataclasses import dataclass

from holocron.domain.oggdude.oggdude_item import OggdudeItem


@dataclass(init=False)
class OggdudeEquipmentItem(ABC, OggdudeItem):
    price: int
    encumbrance: int
    rarity: int
    restricted: bool
    type: str

    def get_price(self, content) -> int:
        return int(content['Price'])

    def get_encumbrance(self, content) -> int:
        return int(content['Encumbrance'])

    @staticmethod
    def get_rarity(content) -> int:
        return int(content['Rarity'])

    @staticmethod
    def get_restricted(content) -> bool:
        return bool(content['Restricted']) if 'Restricted' in content else False

    @staticmethod
    def get_type(content) -> str:
        return str(content['Type']).lower()
