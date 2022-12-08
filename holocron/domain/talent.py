import dataclasses
from typing import Optional

from holocron.domain.source import Source


def get_bool(content: dict, key: str, alt=None) -> bool:
    return content[key] if key in content else alt


@dataclasses.dataclass
class Talent:
    key: str
    name: str
    description: str
    ranked: bool
    activation: str
    sources: Optional[list[Source]] = None

    @classmethod
    def from_oggdude(cls, content):

        key = content['Key']
        name = content['Name']
        description = content['Description']
        ranked = get_bool(content, 'Ranked', False)
        activation = content['ActivationValue'].replace("ta", "")

        return cls(key, name, description, ranked, activation)
