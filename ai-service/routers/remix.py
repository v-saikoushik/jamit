from fastapi import APIRouter
from pydantic import BaseModel
from services.remix_merger import create_remix

router = APIRouter()


class RemixRequest(BaseModel):
    vocals_path: str
    instrumentals_path: str
    output_name: str


@router.post("/create")
async def create(req: RemixRequest):
    return create_remix(req.vocals_path, req.instrumentals_path, req.output_name)
