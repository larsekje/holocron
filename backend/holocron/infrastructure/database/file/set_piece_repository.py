import json
import logging
import re
import unicodedata
from pathlib import Path
from typing import List, Optional

from holocron.definitions import DATA_PATH
from holocron.domain.set_piece import SetPiece, SetPieceBase


LIBRARY_FILE = Path(DATA_PATH) / "set_pieces_library.json"


def slugify(name: str) -> str:
    normalised = unicodedata.normalize("NFKD", name)
    stripped = "".join(ch for ch in normalised if not unicodedata.combining(ch))
    lowered = stripped.lower()
    hyphenated = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return hyphenated or "untitled"


class SetPieceNotFoundError(Exception):
    pass


class SetPieceReadOnlyError(Exception):
    pass


class SetPieceRepository:
    """File-backed set piece store.

    Library pieces load once from a bundled JSON and are read-only.
    User pieces live as individual JSON files under <storage_dir>/set_pieces/.
    """

    logger = logging.getLogger(__name__)

    def __init__(self, storage_dir: str):
        self.user_dir = Path(storage_dir) / "set_pieces"
        self.user_dir.mkdir(parents=True, exist_ok=True)
        self._library: dict[str, SetPiece] = self._load_library()

    def _load_library(self) -> dict[str, SetPiece]:
        if not LIBRARY_FILE.exists():
            self.logger.warning("Set piece library file not found at %s", LIBRARY_FILE)
            return {}
        with LIBRARY_FILE.open("r", encoding="utf-8") as fh:
            raw = json.load(fh)
        library: dict[str, SetPiece] = {}
        for entry in raw:
            entry = {**entry, "source": "library"}
            piece = SetPiece(**entry)
            library[piece.id] = piece
        return library

    def _user_path(self, piece_id: str) -> Path:
        return self.user_dir / f"{piece_id}.json"

    def _load_user_pieces(self) -> List[SetPiece]:
        pieces: List[SetPiece] = []
        for path in sorted(self.user_dir.glob("*.json")):
            try:
                with path.open("r", encoding="utf-8") as fh:
                    data = json.load(fh)
                data["source"] = "user"
                pieces.append(SetPiece(**data))
            except Exception as exc:  # noqa: BLE001
                self.logger.warning("Failed to load user set piece %s: %s", path, exc)
        return pieces

    def list_all(self) -> List[SetPiece]:
        return list(self._library.values()) + self._load_user_pieces()

    def get(self, piece_id: str) -> SetPiece:
        if piece_id in self._library:
            return self._library[piece_id]
        path = self._user_path(piece_id)
        if not path.exists():
            raise SetPieceNotFoundError(piece_id)
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        data["source"] = "user"
        return SetPiece(**data)

    def _unique_user_id(self, base: str) -> str:
        candidate = base
        counter = 2
        while self._user_path(candidate).exists() or candidate in self._library:
            candidate = f"{base}-{counter}"
            counter += 1
        return candidate

    def create(self, payload: SetPieceBase) -> SetPiece:
        base_id = slugify(payload.name)
        piece_id = self._unique_user_id(base_id)
        piece = SetPiece(id=piece_id, source="user", **payload.dict())
        self._write(piece)
        return piece

    def update(self, piece_id: str, payload: SetPieceBase) -> SetPiece:
        if piece_id in self._library:
            raise SetPieceReadOnlyError(piece_id)
        if not self._user_path(piece_id).exists():
            raise SetPieceNotFoundError(piece_id)
        piece = SetPiece(id=piece_id, source="user", **payload.dict())
        self._write(piece)
        return piece

    def delete(self, piece_id: str) -> None:
        if piece_id in self._library:
            raise SetPieceReadOnlyError(piece_id)
        path = self._user_path(piece_id)
        if not path.exists():
            raise SetPieceNotFoundError(piece_id)
        path.unlink()

    def _write(self, piece: SetPiece) -> None:
        path = self._user_path(piece.id)
        with path.open("w", encoding="utf-8") as fh:
            json.dump(piece.dict(), fh, indent=2, ensure_ascii=False)
