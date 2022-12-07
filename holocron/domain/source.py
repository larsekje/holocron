from dataclasses import dataclass
from typing import Optional


@dataclass
class Source:
    text: str
    page: Optional[int] = None

    @classmethod
    def from_oggdude(cls, content):
        if '#text' in content and '@Page' in content:
            return cls(content['#text'], int(content['@Page']))
        else:
            return cls(content)

