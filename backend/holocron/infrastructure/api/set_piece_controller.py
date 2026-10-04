from typing import List

from dependency_injector.wiring import Provide
from fastapi import APIRouter, HTTPException, status

from holocron.container import ApplicationContainer
from holocron.domain.set_piece import SetPiece, SetPieceBase
from holocron.infrastructure.database.file.set_piece_repository import (
    SetPieceNotFoundError,
    SetPieceReadOnlyError,
    SetPieceRepository,
)


set_piece_repository: SetPieceRepository = Provide[ApplicationContainer.set_piece_repository]

router = APIRouter(prefix="/set-pieces", tags=["set-pieces"])


@router.get("/", response_model=List[SetPiece])
async def list_set_pieces() -> List[SetPiece]:
    return set_piece_repository.list_all()


@router.get("/{piece_id}", response_model=SetPiece)
async def get_set_piece(piece_id: str) -> SetPiece:
    try:
        return set_piece_repository.get(piece_id)
    except SetPieceNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="set piece not found")


@router.post("/", response_model=SetPiece, status_code=status.HTTP_201_CREATED)
async def create_set_piece(payload: SetPieceBase) -> SetPiece:
    return set_piece_repository.create(payload)


@router.put("/{piece_id}", response_model=SetPiece)
async def update_set_piece(piece_id: str, payload: SetPieceBase) -> SetPiece:
    try:
        return set_piece_repository.update(piece_id, payload)
    except SetPieceReadOnlyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="library set pieces are read-only; fork to user storage via POST",
        )
    except SetPieceNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="set piece not found")


@router.delete("/{piece_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_set_piece(piece_id: str) -> None:
    try:
        set_piece_repository.delete(piece_id)
    except SetPieceReadOnlyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="library set pieces cannot be deleted",
        )
    except SetPieceNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="set piece not found")
