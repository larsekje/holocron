"""
sync_controller — a tiny in-memory relay that mirrors the GM's encounter state
to read-only player views (the "Share with players" feature).

Flow: the GM browser POSTs a spoiler-safe snapshot to /sync/{room_id} on every
state change (debounced). Player browsers subscribe via Server-Sent Events on
/sync/{room_id}/stream and receive each snapshot. New subscribers immediately
get the last snapshot so they aren't stuck waiting.

HARD CONSTRAINT: the room registry lives in module-level process memory, so this
is correct ONLY under a single uvicorn worker (the current deployment runs
`uvicorn.run(app, ...)` with no `workers=`/`--reload`). Running multiple workers
would split rooms across processes and break fan-out. There is no persistence:
on restart the rooms are gone and recover on the GM's next publish.
"""
import asyncio
import json
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Dict, Optional, Set

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

router = APIRouter(prefix="/sync", tags=["sync"])

KEEPALIVE_SECONDS = 15
QUEUE_MAXSIZE = 16


@dataclass
class Room:
    # Pre-serialized compact JSON string of the latest snapshot, replayed to
    # late joiners. None until the GM publishes once.
    last_snapshot: Optional[str] = None
    # Players subscribed to GM state (SSE).
    subscribers: Set["asyncio.Queue[str]"] = field(default_factory=set)
    # GM subscribed to player actions (the reverse channel: tap-to-flip
    # Destiny, PC advancing a turn). Actions are transient events, not state,
    # so there's nothing to replay to a late-joining GM.
    action_subscribers: Set["asyncio.Queue[str]"] = field(default_factory=set)


# room_id -> Room. Single-process only (see module docstring).
_rooms: Dict[str, Room] = {}


def _get_or_create(room_id: str) -> Room:
    room = _rooms.get(room_id)
    if room is None:
        room = Room()
        _rooms[room_id] = room
    return room


def publish(room_id: str, snapshot: str) -> int:
    """Store the snapshot as the room's latest and fan it out to every
    subscriber queue. Returns the number of subscribers it reached.

    A slow consumer must never block the GM's publish, so we use put_nowait and,
    on overflow, drop the oldest queued frame to make room for the newest.
    """
    room = _get_or_create(room_id)
    room.last_snapshot = snapshot

    dead: list["asyncio.Queue[str]"] = []
    for q in room.subscribers:
        try:
            q.put_nowait(snapshot)
        except asyncio.QueueFull:
            try:
                q.get_nowait()
                q.put_nowait(snapshot)
            except Exception:
                dead.append(q)
    for q in dead:
        room.subscribers.discard(q)
    return len(room.subscribers)


def subscribe(room_id: str) -> "asyncio.Queue[str]":
    """Register a new subscriber queue for the room and return it."""
    room = _get_or_create(room_id)
    queue: "asyncio.Queue[str]" = asyncio.Queue(maxsize=QUEUE_MAXSIZE)
    room.subscribers.add(queue)
    return queue


def unsubscribe(room_id: str, queue: "asyncio.Queue[str]") -> None:
    room = _rooms.get(room_id)
    if room is not None:
        room.subscribers.discard(queue)


def publish_action(room_id: str, action: str) -> int:
    """Fan a player action out to the GM's action subscribers. Unlike state,
    actions aren't stored — they're one-shot events."""
    room = _get_or_create(room_id)
    dead: list["asyncio.Queue[str]"] = []
    for q in room.action_subscribers:
        try:
            q.put_nowait(action)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        room.action_subscribers.discard(q)
    return len(room.action_subscribers)


def subscribe_actions(room_id: str) -> "asyncio.Queue[str]":
    room = _get_or_create(room_id)
    queue: "asyncio.Queue[str]" = asyncio.Queue(maxsize=QUEUE_MAXSIZE)
    room.action_subscribers.add(queue)
    return queue


def unsubscribe_actions(room_id: str, queue: "asyncio.Queue[str]") -> None:
    room = _rooms.get(room_id)
    if room is not None:
        room.action_subscribers.discard(queue)


def reset_rooms() -> None:
    """Clear all rooms. Used by tests for isolation."""
    _rooms.clear()


@router.post("/{room_id}", name="sync_publish")
async def sync_publish(room_id: str, request: Request) -> JSONResponse:
    payload: Any = await request.json()
    # Serialize once here so the SSE side never re-encodes per subscriber and
    # all subscribers receive byte-identical frames.
    snapshot = json.dumps(payload, separators=(",", ":"))
    reached = publish(room_id, snapshot)
    return JSONResponse({"ok": True, "subscribers": reached})


@router.get("/{room_id}/stream", name="sync_stream")
async def sync_stream(room_id: str, request: Request) -> StreamingResponse:
    room = _get_or_create(room_id)
    queue = subscribe(room_id)

    async def event_gen() -> AsyncIterator[str]:
        try:
            # Replay the latest snapshot so a late joiner sees state at once.
            if room.last_snapshot is not None:
                yield f"data: {room.last_snapshot}\n\n"
            while True:
                # Belt-and-suspenders: bail if the socket died while we were
                # parked on wait_for and no new frame arrived to surface it.
                if await request.is_disconnected():
                    break
                try:
                    snapshot = await asyncio.wait_for(
                        queue.get(), timeout=KEEPALIVE_SECONDS
                    )
                    yield f"data: {snapshot}\n\n"
                except asyncio.TimeoutError:
                    # SSE comment line — keeps the connection (and any proxy)
                    # alive without delivering a data event.
                    yield ": keepalive\n\n"
        finally:
            # Runs on client disconnect (generator cancelled) too.
            unsubscribe(room_id, queue)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # harmless without nginx; future-proofs
        },
    )


@router.post("/{room_id}/action", name="sync_action")
async def sync_action(room_id: str, request: Request) -> JSONResponse:
    payload: Any = await request.json()
    action = json.dumps(payload, separators=(",", ":"))
    delivered = publish_action(room_id, action)
    return JSONResponse({"ok": True, "delivered": delivered})


@router.get("/{room_id}/actions", name="sync_actions")
async def sync_actions(room_id: str, request: Request) -> StreamingResponse:
    queue = subscribe_actions(room_id)

    async def event_gen() -> AsyncIterator[str]:
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    action = await asyncio.wait_for(
                        queue.get(), timeout=KEEPALIVE_SECONDS
                    )
                    yield f"data: {action}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            unsubscribe_actions(room_id, queue)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
