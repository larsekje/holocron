import logging
from dataclasses import dataclass
from typing import Any

from holocron.domain.item_descriptor import ItemDescriptor
from holocron.domain.oggdude.oggdude_attachment import OggdudeAttachment
from holocron.domain.oggdude.oggdude_mod import OggdudeMod
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent


class ModParsingException(Exception):
    pass


@dataclass
class ModBuilder:
    descriptors: dict[str, ItemDescriptor]
    skills: dict[str, Skill]
    talents: dict[str, Talent]

    logger = logging.getLogger(__name__)

    def parse_attachment(self, attachment: OggdudeAttachment):
        base_mods = self.parse(attachment.base_mods, attachment, True)
        adds_mods = self.parse(attachment.additional_mods, attachment, False)

        return base_mods, adds_mods

    def parse(self, mod: Any, attachment: OggdudeAttachment, is_base_mod) -> list[str]:
        if isinstance(mod, list):
            if len(mod) > 0:
                return self._parse_list(mod, attachment, is_base_mod)
            else:
                return ['None']

        elif isinstance(mod, OggdudeMod):
            return [self._parse_single(mod, attachment, is_base_mod)]
        else:
            raise TypeError(f"Mod with type '{type(mod)} is not supported'")

    def _parse_list(self, mods: list[OggdudeMod], attachment: OggdudeAttachment, is_base_mod) -> list[str]:
        parsed_mods = []
        for mod in mods:
            parsed_mod = self._parse_single(mod, attachment, is_base_mod)
            parsed_mods.append(parsed_mod)

        return parsed_mods

    def _parse_single(self, mod: OggdudeMod, attachment: OggdudeAttachment, is_base_mod) -> str:
        count = mod.count

        description = ''
        if mod.key is not None:

            if mod.key in self.descriptors:
                descriptor = self.descriptors[mod.key]

                if descriptor.is_quality:
                    description = f"{{type}} Quality ({descriptor.mod_desc})"
                else:
                    description = descriptor.mod_desc

            elif mod.key in self.talents:
                talent = self.talents[mod.key]
                if count is None and talent.ranked is not False:
                    count = 1

                if count != 1 and talent.ranked is True:
                    raise ValueError(f"Illegal value: count={count} for mod with key='{mod.key}'")

                description = f"Innate Talent ({talent.name})"

            elif mod.key in self.skills:
                skill = self.skills[mod.key]
                description = f"Skill ({skill.name})"

            elif mod.key in ('BR', 'AG', 'INT', 'CUN', 'WIL', 'PR'):
                if mod.key == 'BR':
                    description = f"Increases wearer's Brawn while wearing this {attachment.type}. " \
                                  f"This does not increase soak or wound threshold."
                else:
                    raise ModParsingException(f"No description for characteristic '{mod.key}'")

            elif mod.key in ('SUBQUALINACCURATE', 'SUBQUALCUMBERSOME', 'SUBQUALUNWIELDY', 'SUBQUALVICIOUS'):
                pass

            else:
                raise ModParsingException(f"Unknown modification '{mod.key}' for attachment '{attachment.key}' "
                                          f"({attachment.source[0].text} p.{attachment.source[0].page})")

        elif mod.desc is not None:
            description = mod.desc

        else:
            raise ModParsingException(f"Illegal state. Both key and desc are None")

        # replace
        description = description.replace("{0}", "+1")
        description = description.replace("{type}", attachment.type.capitalize())

        return f"{count} {description} {'Mod' if count == 1 or count is None else 'Mods'}"

