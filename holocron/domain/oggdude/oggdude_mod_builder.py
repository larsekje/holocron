from dataclasses import dataclass
from typing import Any

from holocron.domain.item_descriptor import ItemDescriptor
from holocron.domain.oggdude.oggdude_attachment import OggdudeAttachment
from holocron.domain.oggdude.oggdude_mod import OggdudeMod
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent


@dataclass
class ModBuilder:
    descriptors: dict[str, ItemDescriptor]
    skills: dict[str, Skill]
    talents: dict[str, Talent]

    def parse(self, mod: Any, attachment: OggdudeAttachment):
        if isinstance(mod, list):
            return self.parse_list(mod, attachment)
        elif isinstance(mod, OggdudeMod):
            return [self.parse_single(mod, attachment)]
        else:
            raise TypeError(f"Mod with type '{type(mod)} is not supported'")

    def parse_list(self, mods: list[OggdudeMod], attachment: OggdudeAttachment):
        parsed_mods = []
        for mod in mods:
            parsed_mod = self.parse_single(mod, attachment)
            parsed_mods.append(parsed_mod)

        return parsed_mods

    def parse_single(self, mod: OggdudeMod, attachment: OggdudeAttachment) -> str:
        count = mod.count

        description = ''
        if mod.key is not None:

            if mod.key in self.descriptors:
                descriptor = self.descriptors[mod.key]
                description = descriptor.mod_desc

                if descriptor.is_quality:
                    description = f"{{type}} Quality ({descriptor.mod_desc})"

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

            elif mod.key in ('SUBQUALINACCURATE', 'SUBQUALCUMBERSOME', 'SUBQUALUNWIELDY', 'SUBQUALVICIOUS'):
                pass

            else:
                raise Exception(f"Unknown key '{mod.key}'")

        elif mod.desc is not None:
            description = mod.desc

        else:
            raise Exception(f"Illegal state. Both key and desc are None")

        # special cases
        if mod.key == 'VAKSAI':
            count = 1

        # replace
        if count > 0:
            description = description.replace("{0}", "+1")
        else:
            description = description.replace("{0}", "-1")
            count = -count
        description = description.replace("{type}", attachment.type.capitalize())
        return f"{count} {description} {'Mods' if count > 1 else 'Mod'}"

