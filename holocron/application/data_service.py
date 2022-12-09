from dataclasses import dataclass

from holocron.domain.characteristic import Characteristic
from holocron.domain.data_repository import IDataRepository
from holocron.domain.item_attachment import ItemAttachment
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent
from holocron.infrastructure.api.skill_schema import SkillSchema
from holocron.infrastructure.api.talent_schema import TalentSchema
from holocron.infrastructure.database.file.file_repository import DataFileRepository
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

    def get_attachments(self, types: list[str] = None) -> list[ItemAttachment]:
        return self.data_repository.get_attachments(types)

    # TALENTS

    def get_talents(self) -> list[Talent]:
        return self.data_repository.get_talents()

    def get_talents_web(self) -> list[TalentSchema]:
        return DataService.webify(self.get_talents(), TalentSchema.from_talent)

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

