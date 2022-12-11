import pytest
from httpx import AsyncClient
from holocron.app import init

app = init()


@pytest.mark.anyio
async def test_root():
    async with AsyncClient(app=app, base_url='http://localhost:8080') as ac:
        response = await ac.get('/data/equipment/armor')
    assert response.status_code == 200
    # assert response.json() == {'message': 'Tomato'}
