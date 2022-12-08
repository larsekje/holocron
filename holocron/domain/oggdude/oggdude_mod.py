from dataclasses import dataclass


@dataclass
class OggdudeMod:
    key: str
    count: int
    desc: str

    @classmethod
    def from_dict(cls, content: dict):
        key = content['Key'] if 'Key' in content else None
        count = int(content['Count']) if 'Count' in content else None
        desc = content['MiscDesc'] if 'MiscDesc' in content else None
        return cls(key, count, desc)
