import pytest
from httpx import AsyncClient
from holocron.app import init

app = init()


@pytest.mark.anyio
async def test_weapon():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/equipment/weapon')
    assert response.status_code == 200


@pytest.mark.anyio
async def test_weapon_categories():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/equipment/weapon/categories')
    assert response.status_code == 200


@pytest.mark.anyio
async def test_armor():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/equipment/armor')
    assert response.status_code == 200


@pytest.mark.anyio
async def test_gear():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/equipment/gear')
    assert response.status_code == 200


@pytest.mark.anyio
async def test_gear_categories():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/equipment/gear/categories')
    assert response.status_code == 200


@pytest.mark.anyio
async def test_attachments():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/equipment/attachments')
    assert response.status_code == 200


@pytest.mark.anyio
async def test_vehicle_modifications():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/vehicles/modifications')
    assert response.status_code == 200


@pytest.mark.anyio
async def test_vehicle_weapons():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/vehicles/weapons')
    assert response.status_code == 200
