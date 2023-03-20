from dataclasses import dataclass
from typing import Optional

from holocron.domain.source import Source


@dataclass
class Skill:
    name: str
    type: str
    description: str
    key: str
    char_key: str
    source: Optional[list[Source]] = None

