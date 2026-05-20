from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.recommender import get_recommendations

router = APIRouter()


class RecommendRequest(BaseModel):
    mood: str
    song_ids: List[str] = []


@router.post("/recommend")
async def recommend(req: RecommendRequest):
    return get_recommendations(req.mood, req.song_ids)
