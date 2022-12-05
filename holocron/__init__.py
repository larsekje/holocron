import importlib.metadata
import logging
import sys

logging.basicConfig(
    stream=sys.stdout,
    level=logging.DEBUG,
    format="%(levelname)-7s %(message)s"
)

try:
    __version__ = importlib.metadata.version(__package__)
except (NameError, importlib.metadata.PackageNotFoundError):
    __version__ = "dev"
