from abc import ABC

from holocron.domain.characteristic import Characteristic
from holocron.domain.item_attachment import ItemAttachment
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent


class IDataRepository(ABC):

    def get_characteristics(self) -> list[Characteristic]:
        ...

    def get_skills(self) -> list[Skill]:
        ...

    def get_talents(self) -> list[Talent]:
        ...

    def get_attachments(self) -> list[ItemAttachment]:
        ...