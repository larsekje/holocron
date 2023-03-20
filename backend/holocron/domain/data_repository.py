from abc import ABC

from holocron.domain.characteristic import Characteristic
from holocron.domain.gear import Gear
from holocron.domain.attachment import Attachment
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent
from holocron.domain.weapon import Weapon
from holocron.infrastructure.database.file.file_repository import Armor


class IDataRepository(ABC):

    def get_characteristics(self) -> list[Characteristic]:
        ...

    def get_skills(self) -> list[Skill]:
        ...

    def get_talents(self) -> list[Talent]:
        ...

    def get_attachments(self, types: list[str] = None) -> list[Attachment]:
        ...

    def get_gear(self, types: list[str] = None) -> list[Gear]:
        ...

    def get_armor(self) -> list[Armor]:
        ...

    def get_weapon(self, types: list[str] = None) -> list[Weapon]:
        ...
