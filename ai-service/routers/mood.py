from fastapi import APIRouter
from pydantic import BaseModel
from services.mood_detector import detect_mood

router = APIRouter()


class MoodRequest(BaseModel):
    text: str


@router.post("/detect")
async def detect(req: MoodRequest):
    return detect_mood(req.text)
