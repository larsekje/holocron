from pydantic import BaseModel

from holocron.domain.armor import Armor


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class ArmorSchema(OurBaseModel):
    name: str
    description: str
    price: int
    restricted: bool
    rarity: int
    defense: int
    soak: int
    base_mods: list[str]
    models: list[str]
    source: list[str]

    @classmethod
    def from_armor(cls, armor: Armor):
        return cls(name=armor.name,
                   description=armor.description,
                   price=armor.price,
                   restricted=armor.restricted,
                   rarity=armor.rarity,
                   defense=armor.defense,
                   soak=armor.soak,
                   base_mods=armor.base_mods,
                   models=armor.models,
                   source=[str(source) for source in armor.source]
                   )