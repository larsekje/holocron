from dataclasses import dataclass

from holocron.domain.oggdude.oggdude_source import OggdudeSource


@dataclass(init=False)
class OggdudeItem:
    key: str
    name: str
    description: str
    source: list[OggdudeSource]

    def __init__(self, content: dict):
        self.key = OggdudeItem.get_key(content)
        self.name = OggdudeItem.get_name(content)
        self.description = OggdudeItem.get_description(content)
        self.source = OggdudeItem.get_source(content)

    @staticmethod
    def get_key(content):
        return content['Key']

    @staticmethod
    def get_name(content):
        return content['Name']

    @staticmethod
    def get_description(content):
        return content['Description']

    @staticmethod
    def get_source(content):
        if 'Sources' in content:
            if 'Source' in content['Sources'] and isinstance(content['Sources']['Source'], list):
                return [OggdudeSource.from_unknown_type(source) for source in content['Sources']['Source']]
            else:
                return [OggdudeSource.from_unknown_type(source) for source in content['Sources']]

        elif 'Source' in content:
            return [OggdudeSource.from_unknown_type(content['Source'])]
        else:
            return []

    @property
    def source_model(self):
        return [source.model for source in self.source]

    @staticmethod
    def get_bool_or_default(content: dict, key: str, alt: bool) -> bool:
        return bool(content[key]) if key in content else alt

    @staticmethod
    def get_int_or_default(content: dict, key: str, alt: int) -> int:
        return int(content[key]) if key in content else alt