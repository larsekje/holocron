from pydantic import BaseModel


class WeaponSchema(BaseModel):
    name: str
    skill: str
    damage: int
    range: str
