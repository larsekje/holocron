from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.responses import RedirectResponse
from fastapi.routing import APIRoute

from holocron.container import ApplicationContainer
from holocron.infrastructure.api import data_controller


def setup(app: FastAPI, container: ApplicationContainer) -> None:
    # Add other controllers here
    app.include_router(data_controller.router)

    # Change operationId to something more readable (https://fastapi.tiangolo.com/advanced/path-operation-advanced-configuration/)
    use_route_names_as_operation_ids(app)

    # Inject dependencies
    container.wire(
        modules=[
            data_controller
        ]
    )

    # Redirect to docs
    @app.get("/", include_in_schema=False)
    async def root():
        return RedirectResponse(url="/docs")

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


def use_route_names_as_operation_ids(app: FastAPI) -> None:
    """
    Simplify operation IDs so that generated API clients have simpler function
    names.

    Should be called only after all routes have been added.
    """
    for route in app.routes:
        if isinstance(route, APIRoute):
            route.operation_id = route.name  # in this case, 'read_items'