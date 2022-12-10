from dataclasses import dataclass

from holocron.domain.oggdude.oggdude_equipment import OggdudeEquipmentItem


@dataclass(init=False)
class OggdudeGear(OggdudeEquipmentItem):

    def __init__(self, content):
        super().__init__(content)
        self.type = self.get_type(content)
        self.price = self.get_price(content)
        self.encumbrance = self.get_encumbrance(content)
        self.rarity = self.get_rarity(content)
        self.restricted = self.get_restricted(content)

    def get_encumbrance(self, content) -> int:
        return super().get_encumbrance(content)

    def get_price(self, content) -> int:
        return super().get_price(content)
