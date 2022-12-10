from pydantic import BaseModel

from holocron.domain.gear import Gear


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class GearSchema(OurBaseModel):
    name: str
    description: str
    category: str
    price: int
    restricted: bool
    rarity: int
    models: list[str]
    source: list[str]

    @classmethod
    def from_gear(cls, gear: Gear):
        return cls(name=gear.name,
                   description=gear.description,
                   category=gear.type,
                   price=gear.price,
                   restricted=gear.restricted,
                   rarity=gear.rarity,
                   models=gear.models,
                   source=[str(source) for source in gear.source]
                   )
