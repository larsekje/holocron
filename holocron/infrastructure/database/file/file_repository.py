import logging
from functools import cache
from typing import Any

from holocron.application.oggdude_builder import OggdudeBuilder, UnsupportedWeaponError
from holocron.domain.armor import Armor
from holocron.domain.characteristic import Characteristic
from holocron.domain.gear import Gear
from holocron.domain.attachment import Attachment
from holocron.domain.item_descriptor import ItemDescriptor
from holocron.domain.oggdude.oggdude_mod_builder import ModBuilder, ModParsingException
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent
from holocron.domain.weapon import Weapon
from holocron.infrastructure.database.file.oggdude2 import oggdude2000
from holocron.utils import dictify


class DataFileRepository:

    logger = logging.getLogger(__name__)

    def __init__(self):
        descriptors = self.get_descriptors_dict()
        skills = self.get_descriptors_dict()
        talents = self.get_talents_dict()

        self.builder = OggdudeBuilder()
        self.builder.mod_builder = ModBuilder(descriptors, skills, talents)

    def get_characteristics(self) -> list[Characteristic]:
        ...

    @cache
    def get_skills(self) -> list[Skill]:
        skills = []
        for skill in oggdude2000('Skills.xml'):
            type = skill['TypeValue'].replace('st', '')
            tmp = Skill(skill['Name'], type, skill['Description'], skill['Key'], skill['CharKey'])
            skills.append(tmp)

        return skills

    @cache
    def get_skills_dict(self) -> dict[str, Skill]:
        return dictify(self.get_skills())

    @cache
    def get_talents(self) -> list[Talent]:
        talents = []
        for tmp in oggdude2000('Talents.xml'):
            talent = Talent.from_oggdude(tmp)
            talents.append(talent)

        return talents

    @cache
    def get_talents_dict(self) -> dict[str, Talent]:
        return dictify(self.get_talents())

    @cache
    def get_descriptors_dict(self) -> dict[str, ItemDescriptor]:
        descriptors = []
        for tmp in oggdude2000('ItemDescriptors.xml'):
            attachment = ItemDescriptor.from_oggdude(tmp)
            descriptors.append(attachment)

        return dictify(descriptors)

    def get_attachments(self, types: list[str] = None) -> list[Attachment]:
        return self.get_oggdude_items('ItemAttachments.xml', Attachment, self.builder.build_attachment, types)

    def get_gear(self, types: list[str] = None) -> list[Gear]:
        return self.get_oggdude_items('Gears.xml', Gear, self.builder.build_gear, types)

    def get_armor(self) -> list[Armor]:
        return self.get_oggdude_items('Armors.xml', Armor, self.builder.build_armor)

    def get_weapon(self, types: list[str] = None) -> list[Weapon]:
        return self.get_oggdude_items('Weapons.xml', Weapon, self.builder.build_weapon, types)

    def get_oggdude_items(self, file: str, ReturnClass, builder, types: list[str] = None) -> list[Any]:
        class_name = ReturnClass.__name__

        self.logger.info(f"Obtaining {class_name}")

        filter_count = 0
        fail_count = 0
        oggdude = []
        data = oggdude2000(file)
        self.logger.debug(f"Found {len(data)} {class_name.lower()} items in dataset")
        for item in data:

            # filter
            if types is not None and 'Type' in item and item['Type'].lower() not in types:
                filter_count += 1
                continue

            # convert
            try:
                foo = builder(item)
                oggdude.append(foo)
            except (ModParsingException, KeyError, ValueError, AttributeError, UnsupportedWeaponError) as e:
                fail_count += 1
                key = item['Key']
                reason = f'{type(e).__name__}: {str(e)}'
                self.logger.warning(f"Parsing of {class_name} with oggdude key '{key}' failed: \"{reason}\"")

        if types is not None:
            self.logger.debug(f"{len(data) - filter_count} {class_name} items were kept when keeping only type==({', '.join(types)})")

        self.logger.debug(f"{len(oggdude)} items were successfully parsed to {class_name}")
        return oggdude

