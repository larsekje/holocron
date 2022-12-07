from pydantic import BaseModel

from holocron.domain.characteristic import Characteristic
from holocron.domain.skill import Skill


class OurBaseModel(BaseModel):
    class Config:
        orm_mode = True


class SkillSchema(OurBaseModel):
    name: str
    characteristic: str
    type: str
    description: str

    @classmethod
    def from_skill(cls, skill: Skill, characteristics: dict[str, Characteristic]):
        return cls(name=skill.name,
                   type=skill.type,
                   characteristic=characteristics[skill.char_key].name,
                   description=skill.description,
                   )
