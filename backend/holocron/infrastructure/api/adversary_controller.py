from fastapi import APIRouter

router = APIRouter(
    prefix="/adversary",
    tags=["adversary"]
)


@router.get("/{id}", deprecated=True)
async def get_adversary(id: str):
    return "adversaries"


@router.post("/{id}", deprecated=True)
async def add_adversary(id: str):
    return "adversaries"


@router.put("/{id}", deprecated=True)
async def replace_adversary(id: str):
    return "adversaries"


@router.delete("/{id}", deprecated=True)
async def delete_adversary(id: str):
    return "adversary {id} deleted"
