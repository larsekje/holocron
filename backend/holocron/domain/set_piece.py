from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field, validator


Tier = Literal["easy", "medium", "hard"]


class QuickAddEntry(BaseModel):
    ref: str = Field(..., min_length=1)
    count: int = Field(..., ge=1, le=20)


class SetPieceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    tier: Tier = "medium"
    scene: str = ""
    battlefield: str = ""
    tactics: str = ""
    suggested_adversaries: str = ""
    quick_add: List[QuickAddEntry] = Field(default_factory=list)
    skill_uses: str = ""
    dice_menu: str = ""
    gm_notes: str = ""


class SetPiece(SetPieceBase):
    id: str
    source: Literal["library", "user"] = "user"

    @validator("id")
    def id_shape(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("id must be a non-empty slug")
        return value
