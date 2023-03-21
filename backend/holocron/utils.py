import os
import dataclasses
import json


class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        return super().default(o)


def dictify(arr):
    foo = {}
    for item in arr:
        foo.update({item.key: item})
    return foo


def is_running_in_docker():
    return os.path.exists('/.dockerenv')
