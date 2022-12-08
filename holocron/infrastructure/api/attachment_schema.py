from pydantic import BaseModel

from holocron.domain.item_attachment import ItemAttachment


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class AttachmentSchema(OurBaseModel):
    name: str
    price: int
    hp: int
    restricted: bool
    rarity: int
    type: str
    description: str
    models: list[str]
    additional_mods: list[str]

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
                   additional_mods=attachment.added_mods
                   )
