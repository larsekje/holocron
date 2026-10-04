from dependency_injector import providers, containers

from holocron.application.data_service import DataService
from holocron.definitions import CONFIG_PATH
from holocron.infrastructure.database.file.file_repository import DataFileRepository
from holocron.infrastructure.database.file.set_piece_repository import SetPieceRepository


class ApplicationContainer(containers.DeclarativeContainer):
    configuration = providers.Configuration()
    configuration.from_yaml(CONFIG_PATH)

    data_repository = providers.Singleton(DataFileRepository)
    data_service = providers.Factory(DataService, data_repository)

    set_piece_repository = providers.Singleton(
        SetPieceRepository,
        storage_dir=configuration.storage_dir,
    )
