from pydantic import BaseModel


class AttachmentSchema(BaseModel):
    name: str
    price: int
    hp: int
    restricted: bool
    rarity: int
