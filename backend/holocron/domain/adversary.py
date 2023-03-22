from dataclasses import dataclass
import copy
from typing import Optional
from holocron.utils import EnhancedJSONEncoder


@dataclass
class Derived:
    soak: int
    wounds: int
    strain: int
    melee_defense: int
    ranged_defense: int


class Characteristic:
    brawn = "brawn"
    agility = "agility"
    intellect = "intellect"
    cunning = "cunning"
    willpower = "willpower"
    presence = "presence"


@dataclass
class Skill:

    name: str
    rank: Optional[int]
    characteristic: str
    type: str

    def __init__(self, name, characteristic, type):
        self.name = name
        self.characteristic = characteristic
        self.type = type
        self.rank = None

    def __call__(self, rank):
        skill = copy.copy(self)
        skill.rank = rank
        return skill


class CombatSkill(Skill):
    def __init__(self, name, characteristic):
        super().__init__(name, characteristic, "combat")


class GeneralSkill(Skill):
    def __init__(self, name, characteristic):
        super().__init__(name, characteristic, "combat")


class KnowledgeSkill(Skill):
    def __init__(self, name, characteristic=Characteristic.intellect):
        super().__init__(name, characteristic, "combat")


class Skills:
    astrogation = GeneralSkill("astrogation", Characteristic.intellect)
    athletics = GeneralSkill("athletics", Characteristic.brawn)
    brawl = CombatSkill("brawl", Characteristic.brawn)
    charm = GeneralSkill("charm", Characteristic.presence)
    coercion = GeneralSkill("coercion", Characteristic.willpower)
    computers = GeneralSkill("computers", Characteristic.intellect)
    cool = GeneralSkill("cool", Characteristic.presence)
    coordination = GeneralSkill("coordination", Characteristic.agility)
    core_worlds = KnowledgeSkill("core worlds")
    deception = GeneralSkill("deception", Characteristic.cunning)
    discipline = GeneralSkill("discipline", Characteristic.willpower)
    education = KnowledgeSkill("education")
    gunnery = CombatSkill("gunnery", Characteristic.agility)
    leadership = GeneralSkill("leadership", Characteristic.presence)
    lore = KnowledgeSkill("lore")
    mechanics = GeneralSkill("mechanics", Characteristic.intellect)
    medicine = GeneralSkill("medicine", Characteristic.intellect)
    melee = CombatSkill("melee", Characteristic.brawn)
    negotiation = GeneralSkill("negotiation", Characteristic.presence)
    outer_rim = KnowledgeSkill("outer_rim")
    perception = GeneralSkill("perception", Characteristic.cunning)
    piloting_planetary = GeneralSkill("piloting: planetary", Characteristic.agility)
    piloting_space = GeneralSkill("piloting: space", Characteristic.agility)
    ranged_heavy = CombatSkill("ranged: heavy", Characteristic.agility)
    ranged_light = CombatSkill("ranged: light", Characteristic.agility)
    skulduggery = GeneralSkill("skulduggery", Characteristic.cunning)
    stealth = GeneralSkill("stealth", Characteristic.agility)
    streetwise = GeneralSkill("streetwise", Characteristic.cunning)
    survival = GeneralSkill("survival", Characteristic.cunning)
    underworld = KnowledgeSkill("underworld")
    vigilance = GeneralSkill("vigilance", Characteristic.willpower)
    xenology = KnowledgeSkill("xenology")

    @staticmethod
    def from_name(name: str) -> Skill:
        return getattr(Skills, name)


@dataclass
class Characteristics:
    brawn: int
    agility: int
    intellect: int
    cunning: int
    willpower: int
    presence: int


@dataclass
class Derived:
    soak: int
    wounds: int
    strain: Optional[int]
    melee_defense: Optional[int]
    ranged_defense: Optional[int]

    def __init__(self, soak, wounds, strain=None, melee_defense=None, ranged_defense=None):
        self.soak = soak
        self.wounds = wounds
        self.strain = strain
        self.melee_defense = melee_defense
        self.ranged_defense = ranged_defense


@dataclass
class Adversary:
    name: str
    type: str
    description: str
    characteristics: Characteristics
    derived: Derived
    skills: list[Skill]


@dataclass
class SkillSchema:

    name: str
    rank: Optional[int]

    def __init__(self, skill: Skill):
        self.name = skill.name
        self.rank = skill.rank


@dataclass
class AdversarySchema:

    name: str
    type: str
    description: str
    characteristics: Characteristics
    derived: Derived
    skills: list[SkillSchema]

    def __init__(self, adversary: Adversary):
        self.name = adversary.name
        self.type = adversary.type
        self.description = adversary.description
        self.characteristics = adversary.characteristics
        self.derived = adversary.derived
        self.skills = [SkillSchema(skill) for skill in adversary.skills]








