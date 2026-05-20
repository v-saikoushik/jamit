# Jamit — AI-Powered Music Remixing Platform

Jamit is a full-stack portfolio application for AI-assisted music remixing and mood-based song recommendations. It demonstrates production-oriented architecture with **React**, **NestJS**, **MongoDB**, and a **Python FastAPI** ML microservice.

![Stack](https://img.shields.io/badge/React-18-61DAFB) ![NestJS](https://img.shields.io/badge/NestJS-10-E0234E) ![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)

## Features

- **JWT Authentication** — signup, login, protected routes, user profiles
- **Music Dashboard** — Spotify-inspired dark UI with sidebar navigation
- **Song Upload** — MP3/WAV upload with MongoDB metadata
- **Audio Player** — play/pause, seek, volume, animated waveform
- **AI Stem Separation** — vocals + instrumentals (Spleeter-ready, mock mode for dev)
- **Remix Studio** — combine vocals from one track with instrumentals from another
- **Mood Recommendations** — NLP mood detection + tag-based recommendations
- **Voice Input** — browser Speech Recognition API for mood queries
- **Community Feed** — public remixes, likes, save, share links, downloads
- **Scalable Architecture** — modular services ready for WebSockets & collaboration

## Project Structure

```
jamit/
├── frontend/          # React + TypeScript + Tailwind + Vite
├── backend/           # NestJS REST API + Mongoose
├── ai-service/        # Python FastAPI (separation, mood, remix)
├── docker-compose.yml
└── README.md
```

## Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **MongoDB** 7+ (local or Docker)
- **FFmpeg** (for AI service audio processing)

## Quick Start (Local)

### 1. MongoDB

```bash
docker run -d -p 27017:27017 --name jamit-mongo mongo:7
```

### 2. AI Service

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m textblob.download_corpora
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Set `AI_MOCK_MODE=true` in `.env` for development without GPU/ML dependencies.

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
mkdir -p uploads
npm run start:dev
```

Seed demo data:

```bash
npm run seed
# Login: demo@jamit.app / password123
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**

## Docker (All Services)

```bash
cp .env.example .env
docker-compose up --build
```

| Service    | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| API       | http://localhost:3001/api  |
| Swagger   | http://localhost:3001/api/docs |
| AI Service| http://localhost:8000/health |

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/songs/upload` | Upload track |
| POST | `/api/songs/:id/separate` | AI stem separation |
| POST | `/api/remixes` | Create remix |
| POST | `/api/mood/recommend` | Mood + recommendations |
| GET | `/api/community/feed` | Public remix feed |
| GET | `/api/remixes/share/:shareId` | Shareable remix |

## AI Service Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/separate` | Vocal/instrumental separation |
| `POST /api/mood/detect` | NLP mood classification |
| `POST /api/recommend` | Mood-based song ranking |
| `POST /api/remix/create` | Merge vocals + instrumentals |

### Enabling Real Separation (Spleeter)

```bash
pip install spleeter
# Set AI_MOCK_MODE=false in ai-service/.env
```

## Environment Variables

See `.env.example` files in root, `backend/`, `frontend/`, and `ai-service/`.

## Database Schemas

- **Users** — auth, playlists, remixes, likes, recently played
- **Songs** — uploads, stems, mood tags, play counts
- **Playlists** — songs + remixes collections
- **Remixes** — cross-track mixes, share IDs, likes
- **MoodHistory** — NLP query log + recommendations

## Future-Ready Extensions

The codebase is structured for:

- WebSocket live jam sessions (`@nestjs/websockets`)
- Collaborative remix rooms (shared state + CRDT)
- Friend invites & shared playlists
- Cloud storage (S3) for uploads
- Embedding-based recommendations (HuggingFace)

## Tech Highlights (Resume)

- Modular NestJS architecture with DTO validation, guards, Swagger
- Microservice pattern for ML workloads (Python ↔ Node via HTTP)
- Zustand global audio player + Web Audio waveform visualization
- Framer Motion UI animations, responsive mobile nav
- JWT-secured REST API with Multer file uploads

## License

MIT — built for portfolio and learning purposes.
