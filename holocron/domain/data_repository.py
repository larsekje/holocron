from abc import ABC

from holocron.domain.characteristic import Characteristic
from holocron.domain.skill import Skill


class IDataRepository(ABC):

    def get_characteristics(self) -> list[Characteristic]:
        ...

    def get_skills(self) -> list[Skill]:
        ...
