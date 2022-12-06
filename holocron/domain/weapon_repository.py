from abc import ABC

from holocron.domain.attachment import Attachment
from holocron.domain.weapon import Weapon


class IWeaponRepository(ABC):

    def get_all(self) -> list[Weapon]:
        ...

    def get_all_attachments(self) -> list[Attachment]:
        ...
