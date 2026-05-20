"""NLP mood detection using TextBlob sentiment + keyword mapping."""
import re

MOOD_KEYWORDS = {
    "sad": ["sad", "depressed", "lonely", "cry", "heartbreak", "melancholy", "blue", "down"],
    "happy": ["happy", "joy", "excited", "cheerful", "great", "amazing", "love", "fun"],
    "energetic": ["energetic", "workout", "pump", "hype", "party", "dance", "run", "gym"],
    "calm": ["calm", "relax", "peaceful", "chill", "meditate", "sleep", "quiet", "soothe"],
    "angry": ["angry", "mad", "furious", "rage", "frustrated"],
    "focus": ["focus", "study", "work", "concentrate", "productive"],
    "romantic": ["romantic", "date", "love", "romance", "intimate"],
}

MOOD_TAGS = {
    "sad": ["sad", "chill", "night"],
    "happy": ["happy", "energetic"],
    "energetic": ["energetic", "happy", "workout"],
    "calm": ["calm", "focus", "chill"],
    "angry": ["energetic", "intense"],
    "focus": ["focus", "calm"],
    "romantic": ["chill", "romantic", "sad"],
    "neutral": ["neutral", "chill"],
}


def detect_mood(text: str) -> dict:
    text_lower = text.lower().strip()

    # Keyword matching
    scores = {mood: 0 for mood in MOOD_KEYWORDS}
    for mood, keywords in MOOD_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[mood] += 1

    best_mood = max(scores, key=scores.get) if max(scores.values()) > 0 else "neutral"

    # TextBlob sentiment as secondary signal
    confidence = 0.75
    message = f"Detected mood: {best_mood}"
    try:
        from textblob import TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        if scores[best_mood] == 0:
            if polarity > 0.3:
                best_mood = "happy"
            elif polarity < -0.3:
                best_mood = "sad"
            else:
                best_mood = "calm"
        confidence = min(0.95, 0.6 + abs(polarity) * 0.3 + scores.get(best_mood, 0) * 0.1)
        message = f"Based on your message, you seem {best_mood}. Polarity: {polarity:.2f}"
    except Exception:
        pass

    tags = MOOD_TAGS.get(best_mood, ["neutral"])
    return {
        "mood": best_mood,
        "tags": tags,
        "confidence": round(confidence, 2),
        "message": message,
    }
