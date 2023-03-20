from pydantic import BaseModel

from holocron.domain.weapon import Weapon


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class WeaponSchema(OurBaseModel):
    name: str
    description: str
    models: list[str]
    type: str
    skill: str
    price: int
    restricted: bool
    hp: int
    rarity: int
    encumbrance: int
    damage: int
    plus_damage: bool
    crit: int
    range: str
    qualities: list[str]
    base_mods: list[str]
    source: list[str]

    @classmethod
    def from_weapon(cls, weapon: Weapon):
        return cls(
            name=weapon.name,
            description=weapon.description,
            models=weapon.models,
            type=weapon.type,
            hp=weapon.hp,
            rarity=weapon.rarity,
            price=weapon.price,
            base_mods=weapon.base_mods,
            encumbrance=weapon.encumbrance,
            damage=weapon.damage,
            plus_damage=weapon.plus_damage,
            crit=weapon.crit,
            range=weapon.range,
            skill=weapon.skill,
            qualities=weapon.qualities,
            restricted=weapon.restricted,
            source=[str(source) for source in weapon.source]
        )