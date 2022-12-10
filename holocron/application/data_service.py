from dataclasses import dataclass

from holocron.domain.characteristic import Characteristic
from holocron.domain.data_repository import IDataRepository
from holocron.domain.gear import Gear
from holocron.domain.attachment import Attachment
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent
from holocron.infrastructure.api.skill_schema import SkillSchema
from holocron.infrastructure.api.talent_schema import TalentSchema
from holocron.infrastructure.database.file.file_repository import DataFileRepository, Armor
from holocron.utils import dictify


@dataclass
class DataService:
    data_repository: IDataRepository

    # SKILLS

    def get_skills(self) -> list[Skill]:
        return self.data_repository.get_skills()

    def get_skills_web(self) -> list[SkillSchema]:
        characteristics = dictify(self.get_characteristics())
        return DataService.webify(self.get_skills(), SkillSchema.from_skill, characteristics)

    # CHARACTERISTICS

    def get_characteristics(self) -> list[Characteristic]:
        return self.data_repository.get_characteristics()

    # ATTACHMENT

    def get_attachments(self, types: list[str] = None) -> list[Attachment]:
        return self.data_repository.get_attachments(types)

    # GEAR
    def get_gear(self, types: list[str] = None) -> list[Gear]:
        return self.data_repository.get_gear(types)

    def get_gear_categories(self):
        types = []
        for gear in self.get_gear():
            types.append(gear.type)

        return list(set(types))

    # TALENTS

    def get_talents(self) -> list[Talent]:
        return self.data_repository.get_talents()

    def get_talents_web(self) -> list[TalentSchema]:
        return DataService.webify(self.get_talents(), TalentSchema.from_talent)

    # ARMOR

    def get_armor(self) -> list[Armor]:
        return self.data_repository.get_armor()

    @staticmethod
    def webify(arr, func, *args):
        schemas = []
        for item in arr:
            schema = func(item, *args)
            schemas.append(schema)
        return schemas


if __name__ == '__main__':

    repo = DataFileRepository()
    data_service = DataService(repo)

    for attachment in data_service.get_attachments():
        if len(attachment.added_mods) > 0:
            print(attachment)

