import logging
from functools import cache

from holocron.domain.characteristic import Characteristic
from holocron.domain.item_attachment import ItemAttachment
from holocron.domain.item_descriptor import ItemDescriptor
from holocron.domain.oggdude.oggdude_attachment import OggdudeAttachment
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
        self.logger.info("Obtaining attachments")

        # get oggdude representation
        oggdude_attachments = []
        data = oggdude2000('ItemAttachments.xml')
        self.logger.debug(f"Found {len(data)} attachments in dataset")
        for item in data:
            key = item['Key']

            try:
                foo = OggdudeAttachment(item)
                oggdude_attachments.append(foo)
            except Exception as e:
                reason = f'{type(e).__name__}: {str(e)}'
                self.logger.warning(f"Parsing of OggdudeAttachment with key '{key}' failed: '{reason}'")

        self.logger.debug(f"{len(oggdude_attachments)} items were successfully parsed to OggdudeAttachment")

        # filter away
        if types is not None:
            oggdude_attachments = [attachment for attachment in oggdude_attachments if attachment.type in types]
            self.logger.debug(f"{len(oggdude_attachments)} attachments remaining after keeping only type==({', '.join(types)})")

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

