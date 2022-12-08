from functools import cache

from holocron.domain.characteristic import Characteristic
from holocron.domain.data_repository import IDataRepository
from holocron.domain.item_attachment import ItemAttachment
from holocron.domain.skill import Skill
from holocron.domain.talent import Talent
from holocron.infrastructure.database.file.oggdude_repository import OggdudeRepository
from holocron.infrastructure.database.file.stoogoff_repository import StoogoffRepository


class DataFileRepository(IDataRepository):
    oggdude_repository: OggdudeRepository = OggdudeRepository()
    stoogoff_repository: StoogoffRepository = StoogoffRepository()

    @cache
    def get_characteristics(self) -> list[Characteristic]:
        return self.oggdude_repository.get_characteristics()

    @cache
    def get_skills(self) -> list[Skill]:
        return self.oggdude_repository.get_skills()

    @cache
    def get_talents(self) -> list[Talent]:
        return self.oggdude_repository.get_talents()

    @cache
    def get_attachments(self) -> list[ItemAttachment]:
        return self.oggdude_repository.get_attachments()

    @cache
    def get_adversaries(self) -> list[ItemAttachment]:
        return self.stoogoff_repository.get_adversaries()
