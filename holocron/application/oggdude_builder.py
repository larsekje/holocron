from dataclasses import dataclass
from string import punctuation

from holocron.domain.armor import Armor
from holocron.domain.gear import Gear
from holocron.domain.attachment import Attachment
from holocron.domain.oggdude.oggdude_mod import OggdudeMod
from holocron.domain.oggdude.oggdude_mod_builder import ModBuilder
from holocron.domain.oggdude.oggdude_source import OggdudeSource
from holocron.domain.talent import Talent
from holocron.domain.weapon import Weapon


class UnsupportedWeaponError(Exception):
    pass


@dataclass(init=False)
class OggdudeBuilder:

    _mod_builder: ModBuilder = None
    content = None

    def reset(self):
        self.content = None

    @property
    def mod_builder(self) -> ModBuilder:
        return self._mod_builder

    @mod_builder.setter
    def mod_builder(self, mod_builder: ModBuilder):
        self._mod_builder = mod_builder

    def build_armor(self, content) -> Armor:
        self.content = content

        armor = Armor(
            self.get_name(),
            self.get_description(),
            self.get_defense(),
            self.get_soak(),
            self.get_price(),
            self.get_restricted(),
            self.get_rarity(),
            self.get_base_mods(),
            self.get_models(),
            self.get_source()
        )

        self.reset()
        return armor

    def build_gear(self, content) -> Gear:
        self.content = content

        gear = Gear(
            self.get_name(),
            self.get_description(),
            self.get_type(),
            self.get_price(),
            self.get_restricted(),
            self.get_rarity(),
            self.get_models(),
            self.get_source()
        )

        self.reset()
        return gear

    def build_attachment(self, content) -> Attachment:
        self.content = content

        attachment = Attachment(
            self.get_name(),
            self.get_description(),
            self.get_models(),
            self.get_type(),
            self.key,
            self.get_hardpoints(),
            self.get_rarity(),
            self.get_price(),
            self.get_base_mods(),
            self.get_adds_mods(),
            self.get_encumbrance(default=0),
            self.get_restricted(),
            self.get_source()
        )

        self.reset()
        return attachment

    def build_talent(self, content) -> Talent:
        self.content = content

        talent = Talent(
            self.key,
            self.get_name(),
            self.get_description(),
            self.get_ranked(),
            self.get_activation(),
            self.get_source()
        )

        self.reset()
        return talent

    def build_weapon(self, content) -> Weapon:
        self.content = content

        dmg, plus_damage = self.get_damage()
        weapon = Weapon(
            self.get_name(),
            self.get_description(),
            self.get_models(),
            self.get_type(),
            self.key,
            self.get_hardpoints(),
            self.get_rarity(),
            self.get_price(),
            self.get_base_mods(),
            self.get_encumbrance(),
            dmg,
            plus_damage,
            self.get_crit(),
            self.get_range(),
            self.get_skill(),
            self.get_restricted(),
            self.get_source()
        )

        self.reset()
        return weapon

    @property
    def key(self):
        return self.content['Key']

    def get_name(self):
        return self.content['Name']

    def get_description(self):
        description = self.content['Description']
        return description.split('Models Include:')[0]

    def get_price(self) -> int:
        return int(self.content['Price'])

    def get_encumbrance(self, default=None) -> int:
        if default is None:
            return int(self.content['Encumbrance'])
        else:
            return int(self.content['Encumbrance']) if 'Encumbrance' in self.content else 0

    def get_rarity(self) -> int:
        return int(self.content['Rarity'])

    def get_restricted(self) -> bool:
        return bool(self.content['Restricted']) if 'Restricted' in self.content else False

    def get_type(self) -> str:
        return str(self.content['Type']).lower()

    def get_hardpoints(self) -> int:
        # if self.built_in:
        #     return 0

        return int(self.content['HP'])

    def get_models(self) -> list[str]:
        description = self.content['Description']
        tmp = description.split('Models Include:')

        if len(tmp) <= 1:
            return []

        models = tmp[-1].split(', ')
        models = [model.strip() for model in models]
        models = [model.strip(punctuation) for model in models]
        return models

    def get_source(self):
        content = self.content

        if 'Sources' in content:
            if 'Source' in content['Sources'] and isinstance(content['Sources']['Source'], list):
                oggdude_source = [OggdudeSource.from_unknown_type(source) for source in content['Sources']['Source']]
            else:
                oggdude_source = [OggdudeSource.from_unknown_type(source) for source in content['Sources']]

        elif 'Source' in content:
            oggdude_source = [OggdudeSource.from_unknown_type(content['Source'])]
        else:
            oggdude_source = []

        return [source.model for source in oggdude_source]

    def get_base_mods(self) -> list[str]:
        foo = OggdudeBuilder.weird_xml_getter(self.content, 'BaseMods', 'Mod', OggdudeMod)
        return self.mod_builder.parse2(foo, True)

    def get_adds_mods(self) -> list[str]:
        foo = OggdudeBuilder.weird_xml_getter(self.content, 'AddedMods', 'Mod', OggdudeMod)
        return self.mod_builder.parse2(foo, False)

    # ARMOR

    def get_defense(self) -> int:
        return int(self.content['Defense'])

    def get_soak(self) -> int:
        return int(self.content['Soak'])

    # TALENT

    def get_ranked(self) -> bool:
        return self.get_bool_or_default(self.content, 'Ranked', False)

    def get_activation(self) -> str:
        activation = self.content['ActivationValue']
        activation = activation[2:]  # first 2 characters are always 'ta'
        activation = activation.replace("IncidentalOOT", "Out-of-turn Incidental")
        return activation

    # WEAPON
    def get_damage(self) -> (int, bool):
        if 'Damage' in self.content:
            return int(self.content['Damage']), False

        if 'DamageAdd' in self.content:
            return int(self.content['DamageAdd']), True

        raise UnsupportedWeaponError(f"{self.key} does not have any damage")

    def get_crit(self) -> int:
        return int(self.content['Crit'])

    def get_range(self) -> str:
        if 'Range' in self.content:
            return self.content['Range']

        return self.content['RangeValue'].replace("wr", "")

    def get_skill(self) -> str:
        return self.content['SkillKey']

    @staticmethod
    def weird_xml_getter(content, parent, child, func):
        if parent in content and child in content[parent]:
            foo = content[parent][child]

            if isinstance(foo, list):
                return [func(mod) for mod in foo]
            elif isinstance(foo, dict):
                return [func(foo)]

        return []

    @staticmethod
    def get_bool_or_default(content: dict, key: str, alt: bool) -> bool:
        return bool(content[key]) if key in content else alt

    @staticmethod
    def get_int_or_default(content: dict, key: str, alt: int) -> int:
        return int(content[key]) if key in content else alt
