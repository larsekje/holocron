from dataclasses import dataclass
from typing import Optional, Any

from holocron.domain.source import Source


@dataclass
class OggdudeSource:
    text: str
    page: Optional[int] = None

    @classmethod
    def from_string(cls, content: str):
        return cls(content)

    @classmethod
    def from_dict(cls, content: dict):
        text = content['#text']
        page = int(content['@Page']) if '@Page' in content else None
        return cls(text, page)

    @classmethod
    def from_unknown_type(cls, content: Any):
        if isinstance(content, dict):
            return OggdudeSource.from_dict(content)
        elif isinstance(content, str):
            return OggdudeSource.from_string(content)
        else:
            raise TypeError(
                f"OggdudeSource.from_unknown_type() does not support '{type(content)}', content={content}", )

    @property
    def model(self) -> Source:
        return Source(
            self.text,
            self.page
        )
