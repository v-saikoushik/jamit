# How Jamit’s AI Works

This document explains what powers Jamit’s “AI” features and what is **not** custom-trained for this project.

## Summary

| Feature | What it uses | Pretrained? | Custom training? |
|---------|----------------|-------------|------------------|
| Mood detection | TextBlob + keyword rules | TextBlob: yes (general English) | No — rules written in code |
| Recommendations | Mood → tag mapping + ranking stub | No ML model | No |
| Stem separation (dev) | Mock file copy | N/A | No |
| Stem separation (prod) | Spleeter or Demucs (optional) | Yes — public models | No |
| Remix merge | pydub / FFmpeg overlay | N/A | No |

**Jamit does not include a dataset we trained for music or moods.** It orchestrates existing tools and simple logic.

---

## 1. Mood detection (`ai-service/services/mood_detector.py`)

**Where it comes from:**
- **[TextBlob](https://textblob.readthedocs.io/)** — Python library built on NLTK; provides sentiment polarity (−1 to +1) on English text.
- **Keyword lists** — Hand-written in our repo (e.g. “sad”, “energetic”, “calm”) mapped to mood labels.

**Flow:**
1. User text → count keyword matches per mood.
2. If no strong match → TextBlob sentiment (positive → happy, negative → sad, neutral → calm).
3. Output: `mood`, `tags`, `confidence`, `message`.

**Not:** A HuggingFace transformer fine-tuned on music reviews (that could be a future upgrade).

---

## 2. Recommendations (`ai-service/services/recommender.py`)

**Where it comes from:**
- Logic in our codebase only.

**Flow:**
1. Detected mood → list of preferred tags (`sad` → `chill`, `night`, etc.).
2. Backend loads songs from MongoDB whose `moodTags` overlap.
3. Recommender re-orders or returns IDs (placeholder for cosine similarity / embeddings).

**Not:** Collaborative filtering or embedding model trained on user listening history.

**Future upgrade:** Sentence embeddings (e.g. `sentence-transformers`) + cosine similarity against song descriptions.

---

## 3. Audio source separation (`ai-service/services/audio_separator.py`)

**Default (`AI_MOCK_MODE=true`):**
- Copies the uploaded file to `*_vocals.mp3` and `*_instrumentals.mp3` so the full app works without GPU or large downloads.

**Production option (`AI_MOCK_MODE=false`):**
- **[Spleeter](https://github.com/deezer/spleeter)** (Deezer) — pretrained 2-stem/4-stem models; you do not train them.
- **[Demucs](https://github.com/facebookresearch/demucs)** (Meta) — alternative pretrained separator.

We did **not** train separation models on your uploads.

---

## 4. Remix creation (`ai-service/services/remix_merger.py`)

**Where it comes from:**
- **[pydub](https://github.com/jiaaro/pydub)** — overlays vocal and instrumental audio tracks (timing/levels).
- **FFmpeg** — underlying audio codec/format handling.

**Not:** A generative AI that composes new melodies; it **mixes** existing stems.

---

## 5. How the backend uses AI

`backend/src/ai/ai.service.ts` calls the Python service over HTTP:

- `POST /api/separate`
- `POST /api/mood/detect`
- `POST /api/recommend`
- `POST /api/remix/create`

NestJS stores results in MongoDB (paths, mood history, remix files).

---

## For interviews / portfolio

You can honestly say:

> “Jamit integrates a FastAPI microservice for audio and NLP workflows. Mood uses TextBlob and rule-based tagging; separation can use pretrained Spleeter/Demucs; remixing uses signal-level mixing with pydub. The architecture is ready to swap in embedding-based recommendations or HuggingFace models without changing the main API contract.”
