from dependency_injector import providers, containers
from definitions import CONFIG_PATH

from holocron.application.todo_service import TodoService
from holocron.application.weapon_service import WeaponService
from holocron.infrastructure.database.todo_entry_repository import (
    TodoEntryPickleRepository,
)
from holocron.infrastructure.database.weapon_repository import WeaponFileRepository


class ApplicationContainer(containers.DeclarativeContainer):
    configuration = providers.Configuration()
    configuration.from_yaml(CONFIG_PATH)

    todo_entry_repository = providers.Singleton(
        TodoEntryPickleRepository, storage_dir=configuration.storage_dir
    )

    weapon_repository = providers.Singleton(
        WeaponFileRepository, data_dir=configuration.data_dir
    )

    todo_service = providers.Factory(TodoService, todo_entry_repository)
    weapon_service = providers.Factory(WeaponService, weapon_repository)
