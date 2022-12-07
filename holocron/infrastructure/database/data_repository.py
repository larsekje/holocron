import logging
from dataclasses import dataclass

from holocron.application.scraper.oggdude2 import oggdude2000, get_source
from holocron.domain.characteristic import Characteristic
from holocron.domain.data_repository import IDataRepository
from holocron.domain.skill import Skill


@dataclass
class DataFileRepository(IDataRepository):

    logger = logging.getLogger(__name__)

    def get_characteristics(self) -> list[Characteristic]:
        self.logger.info("Get characteristics")
        chars = []
        for char in oggdude2000('Characteristics.xml'):
            tmp = Characteristic(char['Name'], char['Description'], char['Key'])
            chars.append(tmp)

        self.logger.debug(f"Received {len(chars)} characteristics")
        return chars

    def get_skills(self) -> list[Skill]:
        self.logger.info("Get skills")
        skills = []
        for skill in oggdude2000('Skills.xml'):
            type = skill['TypeValue'].replace('st', '')
            sources = get_source(skill)
            tmp = Skill(skill['Name'], type, skill['Description'], skill['Key'], skill['CharKey'], sources)
            skills.append(tmp)

        self.logger.debug(f"Received {len(skills)} skills")

        return self.filter_with_source(skills, 'skill(s)')

    def filter_with_source(self, arr: list, what: str, filter='User Data') -> list:

        # Find what needs to be filtered out
        to_be_removed = []
        for foo in arr:
            if any([source.text == filter for source in foo.source]):
                to_be_removed.append(foo)

        # Remove from arr
        for foo in to_be_removed:
            arr.remove(foo)

        # Log
        self.logger.debug(f"Filtered out {len(to_be_removed)} {what}")

        return arr


if __name__ == '__main__':
    repo = DataFileRepository()
    skills = repo.get_skills()
    print(*skills, sep='\n')
