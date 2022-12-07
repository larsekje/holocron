from dataclasses import dataclass

from holocron.domain.characteristic import Characteristic
from holocron.domain.data_repository import IDataRepository
from holocron.domain.skill import Skill
from holocron.infrastructure.api.skill_schema import SkillSchema
from holocron.infrastructure.database.data_repository import DataFileRepository


@dataclass
class DataService:
    data_repository: IDataRepository

    # SKILLS

    def get_skills(self) -> list[Skill]:
        return self.data_repository.get_skills()

    def get_skills_dict(self) -> dict[str, Skill]:
        return DataService.dictify(self.get_skills())

    def get_skills_web(self) -> list[SkillSchema]:
        characteristics = self.get_characteristics_dict()

        schemas = []
        for skill in self.get_skills():
            schema = SkillSchema.from_skill(skill, characteristics)
            schemas.append(schema)
        return schemas

    # CHARACTERISTICS

    def get_characteristics(self) -> list[Characteristic]:
        return self.data_repository.get_characteristics()

    def get_characteristics_dict(self) -> dict[str, Characteristic]:
        return DataService.dictify(self.get_characteristics())

    @staticmethod
    def dictify(arr):
        foo = {}
        for item in arr:
            foo.update({item.key: item})
        return foo


if __name__ == '__main__':
    repo = DataFileRepository()
    data_service = DataService(repo)

    print(data_service.get_skills_web())

