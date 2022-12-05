from pydantic import BaseModel


class WeaponSchema(BaseModel):
    name: str
    damage: int
