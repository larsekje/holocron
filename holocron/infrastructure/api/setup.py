from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from holocron.container import ApplicationContainer
from holocron.infrastructure.api import todo_controller, data_controller, encounter_controller


def setup(app: FastAPI, container: ApplicationContainer) -> None:

    # Add other controllers here
    app.include_router(todo_controller.router)
    app.include_router(data_controller.router)
    app.include_router(encounter_controller.router)

    # Inject dependencies
    container.wire(
        modules=[
            todo_controller,
            data_controller
        ]
    )

    # Customize the openAPI documentation
    def custom_openapi() -> Any:
        if app.openapi_schema:
            return app.openapi_schema
        openapi_schema = get_openapi(
            title="Holocron API",
            # version=__version__,
            version="0.0.1",
            description="A collection of tools and resources to aid the GM in a campaign of SWRPG",
            routes=app.routes,
        )
        if not container.configuration.api_prefix():
            openapi_schema["servers"] = [{"url": "/"}]
        else:
            openapi_schema["servers"] = [{"url": container.configuration.api_prefix()}]
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi
