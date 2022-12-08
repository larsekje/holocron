from dataclasses import dataclass

from holocron.domain.oggdude.oggdude_equipment import OggdudeEquipmentItem
from holocron.domain.oggdude.oggdude_mod import OggdudeMod


@dataclass(init=False)
class OggdudeAttachment(OggdudeEquipmentItem):
    additional_mods: list[OggdudeMod]
    models: list[str]

    def __init__(self, content):
        super().__init__(content)
        self.type = self.get_type(content)
        self.price = 0  # self.get_price(content)
        self.encumbrance = self.get_encumbrance(content)
        self.rarity = 0  # self.get_rarity(content)
        self.restricted = self.get_restricted(content)
        self.additional_mods = self.get_additional_mods(content)
        self.models = self.get_models(content)

    def get_encumbrance(self, content) -> int:
        return super().get_encumbrance(content) if 'Encumbrance' in content else -1

    def get_additional_mods(self, content) -> list[OggdudeMod]:
        if 'AddedMods' in content and 'Mod' in content['AddedMods']:
            foo = content['AddedMods']['Mod']

            if isinstance(foo, list):
                return [OggdudeMod.from_dict(mod) for mod in foo]
            elif isinstance(foo, dict):
                return [OggdudeMod.from_dict(foo)]

        return []

    def get_models(self, content) -> list[str]:
        return ['']