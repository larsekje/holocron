from dependency_injector import providers, containers

from holocron.application.data_service import DataService
from holocron.definitions import CONFIG_PATH

from holocron.application.todo_service import TodoService
from holocron.infrastructure.database.file.file_repository import DataFileRepository
from holocron.infrastructure.database.todo_entry_repository import (
    TodoEntryPickleRepository,
)


class ApplicationContainer(containers.DeclarativeContainer):
    configuration = providers.Configuration()
    configuration.from_yaml(CONFIG_PATH)

    todo_entry_repository = providers.Singleton(
        TodoEntryPickleRepository, storage_dir=configuration.storage_dir
    )

    data_repository = providers.Singleton(DataFileRepository)

    todo_service = providers.Factory(TodoService, todo_entry_repository)
    data_service = providers.Factory(DataService, data_repository)
