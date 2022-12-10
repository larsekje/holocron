import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class TodoEntry:
    id: str
    created_at: datetime
    content: str
    tags: set[str] = field(default_factory=set)

    @classmethod
    def create_from_content(cls, content: str) -> "TodoEntry":
        return cls(id=str(uuid.uuid4()), created_at=datetime.utcnow(), content=content)

    def set_tag(self, tag: str) -> None:
        self.tags.add(tag)
