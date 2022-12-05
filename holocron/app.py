import logging
from pathlib import Path

from fastapi import FastAPI
import uvicorn

from holocron.container import ApplicationContainer
from holocron.infrastructure.api.setup import setup
from holocron import __version__


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
    uvicorn.run(
        app,
        log_config=log_config,
        host="127.0.0.1",
        port=8080,
    )


if __name__ == "__main__":
    start()
