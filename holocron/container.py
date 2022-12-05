from dependency_injector import providers, containers
from definitions import CONFIG_PATH

from holocron.application.todo_service import TodoService
from holocron.application.weapon_service import WeaponService
from holocron.infrastructure.database.todo_entry_repository import (
    TodoEntryPickleRepository,
)


class ApplicationContainer(containers.DeclarativeContainer):
    configuration = providers.Configuration()
    configuration.from_yaml(CONFIG_PATH)

    todo_entry_repository = providers.Singleton(
        TodoEntryPickleRepository, storage_dir=configuration.storage_dir
    )

    todo_service = providers.Factory(TodoService, todo_entry_repository)
    weapon_service = providers.Factory(WeaponService)
