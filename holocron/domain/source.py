from dataclasses import dataclass
from typing import Optional


@dataclass
class Source:
    text: str
    page: Optional[int] = None

    def __repr__(self):
        return f"{self.text} p.{self.page}"


