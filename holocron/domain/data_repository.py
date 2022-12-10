from abc import ABC

from holocron.domain.characteristic import Characteristic
from holocron.domain.gear import Gear
from holocron.domain.item_attachment import ItemAttachment
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent
from holocron.infrastructure.database.file.file_repository import Armor


class IDataRepository(ABC):

    def get_characteristics(self) -> list[Characteristic]:
        ...

    def get_skills(self) -> list[Skill]:
        ...

    def get_talents(self) -> list[Talent]:
        ...

    def get_attachments(self, types: list[str] = None) -> list[ItemAttachment]:
        ...

    def get_gear(self, types: list[str] = None) -> list[Gear]:
        ...

    def get_armor(self) -> list[Armor]:
        ...
