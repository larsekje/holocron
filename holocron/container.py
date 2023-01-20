from dependency_injector import providers, containers

from holocron.application.data_service import DataService
from holocron.definitions import CONFIG_PATH
from holocron.infrastructure.database.file.file_repository import DataFileRepository


class ApplicationContainer(containers.DeclarativeContainer):
    configuration = providers.Configuration()
    configuration.from_yaml(CONFIG_PATH)

    data_repository = providers.Singleton(DataFileRepository)
    data_service = providers.Factory(DataService, data_repository)
