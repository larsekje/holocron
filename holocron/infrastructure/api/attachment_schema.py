from pydantic import BaseModel

from holocron.domain.item_attachment import ItemAttachment


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class AttachmentSchema(OurBaseModel):
    type: str
    name: str
    description: str
    price: int
    hp: int
    restricted: bool
    rarity: int
    models: list[str]
    base_mods: list[str]
    #additional_mods: list[str]
    source: list[str]

    @classmethod
    def from_attachment(cls, attachment: ItemAttachment):
        return cls(name=attachment.name,
                   price=attachment.price,
                   hp=attachment.hp,
                   restricted=attachment.restricted,
                   rarity=attachment.rarity,
                   type=attachment.type,
                   description=attachment.description,
                   models=attachment.models,
                   base_mods=attachment.base_mods,
                   #additional_mods=attachment.added_mods,
                   source=[str(source) for source in attachment.source]
                   )
