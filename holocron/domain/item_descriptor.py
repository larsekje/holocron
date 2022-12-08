from dataclasses import dataclass


@dataclass
class ItemDescriptor:
    key: str
    name: str
    description: str
    mod_desc: str
    qual_desc: int
    is_quality: bool

    @classmethod
    def from_oggdude(cls, content):
        key = content['Key']
        name = content['Name']
        description = content['Description'] if 'Description' in content else None
        mod_desc = content['ModDesc']
        qual_desc = content['QualDesc']
        is_quality = bool(content['IsQuality']) if 'IsQuality' in content else False

        return cls(key, name, description, mod_desc, qual_desc, is_quality)
