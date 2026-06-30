import logging
import os
from pathlib import Path
import json

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from holocron import __version__
from holocron.container import ApplicationContainer
from holocron.infrastructure.api.setup import setup
from holocron.utils import is_running_in_docker


def init() -> FastAPI:
    container = ApplicationContainer()

    str_level = container.configuration.log_level()
    numeric_level = getattr(logging, str_level.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError("Invalid log level: %s" % str_level)
    logging.basicConfig(level=numeric_level)
    logger = logging.getLogger(__name__)
    logger.info("Logging level is set to %s" % str_level.upper())

    # init Database
    Path(container.configuration.storage_dir()).mkdir(parents=True, exist_ok=True)

    # Init API and attach the container
    app = FastAPI()
    app.extra["container"] = container

    # Do setup and dependencies wiring
    setup(app, container)

    # Generate OpenAPI specification
    if is_running_in_docker():
        logger.info("Skipping generation of OpenAPI specification (running in docker)")
    else:
        logger.info("Generating OpenAPI specification (swagger)")
        with open('../../frontend/src/generated/openapi.json', 'w') as f:
            json.dump(app.openapi(), f)

    # Allow CORS for all origins and methods
    logger.warning("CORS is enabled")
    app.add_middleware(CORSMiddleware,
                       allow_origins=["*"],
                       allow_methods=["*"],
                       allow_headers=["*"],
                       )

    # TODO add other initialization here

    return app


def start() -> None:
    """Start application"""
    logger = logging.getLogger(__name__)
    logger.info(f"My TODO app version: {__version__}")
    app = init()

    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["access"]["fmt"] = "%(levelname)-7s %(message)s"
    log_config["formatters"]["default"]["fmt"] = "%(levelname)-7s %(message)s"
    # Port is env-configurable so the dev box can move it when 8080 is taken.
    # Must match the frontend's VITE_SYNC_PORT (see frontend/.env.local) or the
    # player-share SSE stream can't reach the relay and the view stays stuck on
    # "reconnecting".
    port = int(os.environ.get("HOLOCRON_PORT", "8080"))
    uvicorn.run(
        app,
        log_config=log_config,
        host="0.0.0.0",
        port=port,
    )


if __name__ == "__main__":
    start()
