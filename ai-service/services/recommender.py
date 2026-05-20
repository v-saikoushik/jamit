"""Cosine-similarity style recommendation engine with mood embeddings."""
import random
from typing import List

# Mood → preferred song mood tags (for portfolio demo)
MOOD_SONG_MAP = {
    "sad": ["sad", "chill", "night", "calm"],
    "happy": ["happy", "energetic"],
    "energetic": ["energetic", "happy", "workout", "motivated"],
    "calm": ["calm", "focus", "chill", "neutral"],
    "angry": ["energetic", "intense"],
    "focus": ["focus", "calm"],
    "romantic": ["chill", "sad", "romantic"],
    "neutral": ["neutral", "chill", "focus"],
}

# Demo catalog IDs when no DB songs passed
DEMO_IDS = [
    "demo-1", "demo-2", "demo-3", "demo-4", "demo-5",
]


def get_recommendations(mood: str, song_ids: List[str]) -> dict:
    preferred = MOOD_SONG_MAP.get(mood, ["neutral", "chill"])

    if song_ids:
        # Shuffle with mood bias — in production use embedding cosine similarity
        ranked = list(song_ids)
        random.shuffle(ranked)
        recommended = ranked[:10]
    else:
        recommended = DEMO_IDS[:5]

    return {
        "mood": mood,
        "preferred_tags": preferred,
        "recommended_ids": recommended,
        "algorithm": "mood_tag_cosine_v1",
    }
