from pydantic import BaseModel

from holocron.domain.gear import Gear


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class GearSchema(OurBaseModel):
    name: str
    description: str
    type: str
    price: int
    restricted: bool
    rarity: int
    source: list[str]

    @classmethod
    def from_gear(cls, gear: Gear):
        return cls(name=gear.name,
                   description=gear.description,
                   type=gear.type,
                   price=gear.price,
                   restricted=gear.restricted,
                   rarity=gear.rarity,
                   source=[str(source) for source in gear.source]
                   )
