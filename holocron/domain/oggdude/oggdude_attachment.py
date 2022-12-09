from dataclasses import dataclass

from holocron.domain.oggdude.oggdude_equipment import OggdudeEquipmentItem
from holocron.domain.oggdude.oggdude_mod import OggdudeMod


@dataclass(init=False)
class OggdudeAttachment(OggdudeEquipmentItem):
    base_mods: list[OggdudeMod]
    additional_mods: list[OggdudeMod]
    models: list[str]
    hp: int
    built_in: bool

    def __init__(self, content):
        super().__init__(content)
        self.description = self.get_description(content)
        self.type = self.get_type(content)
        self.built_in = self.get_built_in(content)
        self.price = self.get_price(content)
        self.encumbrance = self.get_encumbrance(content)
        self.rarity = self.get_rarity(content)
        self.hp = self.get_hardpoints(content)
        self.restricted = self.get_restricted(content)
        self.base_mods = self.get_base_mods(content)
        self.additional_mods = self.get_additional_mods(content)
        self.models = self.get_models(content)

    @staticmethod
    def get_description(content):
        description = content['Description']
        return description.split('Models Include:')[0]

    def get_price(self, content) -> int:
        if self.built_in:
            return 0

        return super().get_price(content)

    @staticmethod
    def get_built_in(content) -> bool:
        return bool(content["BuiltIn"]) if "BuiltIn" in content else False

    def get_encumbrance(self, content) -> int:
        return int(content["Encumbrance"]) if "Encumbrance" in content else 0

    def get_hardpoints(self, content) -> int:
        if self.built_in:
            return 0

        return int(content['HP'])

    def get_base_mods(self, content) -> list[OggdudeMod]:
        if 'BaseMods' in content and 'Mod' in content['BaseMods']:
            foo = content['BaseMods']['Mod']

            if isinstance(foo, list):
                return [OggdudeMod.from_dict(mod) for mod in foo]
            elif isinstance(foo, dict):
                return [OggdudeMod.from_dict(foo)]

        return []

    def get_additional_mods(self, content) -> list[OggdudeMod]:
        if 'AddedMods' in content and 'Mod' in content['AddedMods']:
            foo = content['AddedMods']['Mod']

            if isinstance(foo, list):
                return [OggdudeMod.from_dict(mod) for mod in foo]
            elif isinstance(foo, dict):
                return [OggdudeMod.from_dict(foo)]

        return []

    @staticmethod
    def get_models(content) -> list[str]:
        description = content['Description']
        tmp = description.split('Models Include:')

        if len(tmp) <= 1:
            return ['None']

        return tmp[-1].split(', ')
