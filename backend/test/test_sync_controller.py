import json

import pytest
from httpx import AsyncClient

from holocron.app import init
from holocron.infrastructure.api import sync_controller

app = init()


@pytest.fixture(autouse=True)
def _clean_rooms():
    sync_controller.reset_rooms()
    yield
    sync_controller.reset_rooms()


@pytest.mark.anyio
async def test_publish_no_subscribers():
    async with AsyncClient(app=app, base_url="http://localhost:8080") as ac:
        response = await ac.post("/sync/room1", json={"v": 1, "round": 2})
    assert response.status_code == 200
    assert response.json() == {"ok": True, "subscribers": 0}


@pytest.mark.anyio
async def test_publish_stores_last_snapshot():
    payload = {"v": 1, "round": 3, "slots": []}
    async with AsyncClient(app=app, base_url="http://localhost:8080") as ac:
        await ac.post("/sync/room2", json=payload)
    room = sync_controller._get_or_create("room2")
    assert room.last_snapshot is not None
    assert json.loads(room.last_snapshot) == payload


@pytest.mark.anyio
async def test_publish_fans_out_to_subscriber():
    # Register a subscriber the way the SSE endpoint does, then publish and
    # confirm the queued frame matches the compact-serialized snapshot.
    queue = sync_controller.subscribe("room3")
    reached = sync_controller.publish("room3", json.dumps({"round": 5}, separators=(",", ":")))
    assert reached == 1
    assert queue.get_nowait() == '{"round":5}'


@pytest.mark.anyio
async def test_late_subscriber_does_not_receive_old_frame_via_queue():
    # The replay of last_snapshot happens in the SSE generator, not the queue —
    # a queue created after a publish should start empty.
    sync_controller.publish("room4", json.dumps({"round": 1}))
    queue = sync_controller.subscribe("room4")
    assert queue.empty()
    # but the room still holds the latest snapshot for replay on connect
    assert sync_controller._get_or_create("room4").last_snapshot is not None
