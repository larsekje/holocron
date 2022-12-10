import logging
from functools import cache
from typing import Any

from holocron.domain.characteristic import Characteristic
from holocron.domain.gear import Gear
from holocron.domain.item_attachment import ItemAttachment
from holocron.domain.item_descriptor import ItemDescriptor
from holocron.domain.oggdude.oggdude_attachment import OggdudeAttachment
from holocron.domain.oggdude.oggdude_gear import OggdudeGear
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent
from holocron.infrastructure.database.file.oggdude2 import oggdude2000
from holocron.utils import dictify


class DataFileRepository:

    logger = logging.getLogger(__name__)

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

    def get_attachments(self, types: list[str] = None) -> list[ItemAttachment]:
        oggdude_attachments = self.get_oggdude_item('attachments', 'ItemAttachments.xml', OggdudeAttachment, types=types)

        # convert to application specific representation
        descriptors = self.get_descriptors_dict()
        skills = self.get_skills_dict()
        talents = self.get_talents_dict()

        self.logger.debug("Creating ModBuilder")

        from holocron.domain.oggdude.oggdude_mod_builder import ModBuilder
        mod_builder = ModBuilder(descriptors, skills, talents)

        self.logger.debug("Converting Oggdude representation to application specific representation")

        attachments = []
        for oggdude_attachment in oggdude_attachments:

            if oggdude_attachment.built_in:
                logging.debug(f"Skipping built-in attachment {oggdude_attachment.key} ({oggdude_attachment.name})")
                continue

            base_mods, adds_mods = mod_builder.parse_attachment(oggdude_attachment)

            attachment = ItemAttachment(
                oggdude_attachment.name,
                oggdude_attachment.description,
                oggdude_attachment.models,
                oggdude_attachment.type,
                oggdude_attachment.key,
                oggdude_attachment.hp,
                oggdude_attachment.rarity,
                oggdude_attachment.price,
                base_mods,
                adds_mods,
                oggdude_attachment.encumbrance,
                oggdude_attachment.restricted,
                oggdude_attachment.source_model
            )

            attachments.append(attachment)

        self.logger.info(f"{len(attachments)} OggdudeAttachments were successfully converted to ItemAttachment")

        return attachments

    def get_gear(self, types: list[str] = None) -> list[Gear]:
        return self.get_oggdude_item('gear', 'Gears.xml', OggdudeGear, ReturnClass=Gear, types=types)

    def get_oggdude_item(self, name: str, file: str, OggdudeClass: Any, ReturnClass=None, types: list[str] = None) -> list[Any]:
        """
        :param name: Name of the item like 'gear' or 'attachment', used for logging
        :param file: File name for oggdude2000, example ItemAttachments.xml
        :param OggdudeClass: Oggdude representation
        :param ReturnClass: If set, the oggdude_items are converted. Requires a from_oggdude classmethod
        :param types: If set, keep only oggdude_items matching these types
        :return: Either list[OggdudeClass] or list[ReturnClass]
        """
        self.logger.info(f"Obtaining {name}")

        # get oggdude representation
        oggdude = []
        data = oggdude2000(file)
        self.logger.debug(f"Found {len(data)} {name} items in dataset")
        for item in data:
            key = item['Key']

            try:
                foo = OggdudeClass(item)
                oggdude.append(foo)
            except Exception as e:
                reason = f'{type(e).__name__}: {str(e)}'
                self.logger.warning(f"Parsing of {OggdudeClass.__name__} with key '{key}' failed: '{reason}'")

        self.logger.debug(f"{len(oggdude)} items were successfully parsed to {OggdudeClass.__name__}")

        # filter away
        if types is not None:
            oggdude = [item for item in oggdude if item.type in types]
            self.logger.debug(f"{len(oggdude)} {name} remaining after keeping only type==({', '.join(types)})")

        if ReturnClass is None:
            return oggdude

        converted = []
        for item in oggdude:
            tmp = ReturnClass.from_oggdude(item)
            converted.append(tmp)
        return converted



if __name__ == '__main__':
    repo = DataFileRepository()
    repo.get_gear()
    # print(repo.get_gear())
