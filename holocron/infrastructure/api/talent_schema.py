from dataclasses import asdict
from typing import Optional

from pydantic import BaseModel

from holocron.domain.source import Source
from holocron.domain.talent import Talent


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class TalentSchema(OurBaseModel):
    name: str
    description: str
    ranked: bool
    activation: str
    sources: Optional[list[Source]] = None

    @classmethod
    def from_talent(cls, talent: Talent):
        return cls(**asdict(talent))
