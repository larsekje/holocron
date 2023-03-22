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


def get_adversaries():
    from holocron.domain.adversary import Characteristics, Derived, Skills, Adversary

    characteristics = Characteristics(3, 3, 2, 2, 3, 1)
    derived = Derived(5, 5)
    skills = [Skills.athletics, Skills.discipline, Skills.melee, Skills.ranged_heavy]
    stormtrooper = Adversary("Imperial Stormtrooper", "minion", "lorem ipsum", characteristics, derived, skills)

    characteristics = Characteristics(2, 2, 3, 2, 3, 3)
    derived = Derived(2, 12)
    skills = [Skills.astrogation(1), Skills.perception(3), Skills.vigilance(2)]
    inspector = Adversary("Customs Inspector", "rival", "lorem ipsum", characteristics, derived, skills)

    return [stormtrooper, inspector]
