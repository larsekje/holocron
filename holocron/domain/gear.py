from dataclasses import dataclass

from holocron.domain.oggdude.oggdude_gear import OggdudeGear


@dataclass
class Gear:
    name: str
    description: str
    type: str
    price: int
    restricted: bool
    rarity: int
    models: list[str]
    source: list[str]

    @classmethod
    def from_oggdude(cls, gear: OggdudeGear):
        return cls(
            gear.name,
            gear.description,
            gear.type,
            gear.price,
            gear.restricted,
            gear.rarity,
            gear.models,
            gear.source_model
        )
