from fastapi import APIRouter
from pydantic import BaseModel
from services.audio_separator import separate_audio

router = APIRouter()


class SeparateRequest(BaseModel):
    file_path: str


@router.post("/separate")
async def separate(req: SeparateRequest):
    result = separate_audio(req.file_path)
    return result
