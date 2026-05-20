# Jamit Architecture

## System Overview

```
┌─────────────┐     REST/JWT      ┌─────────────┐     HTTP       ┌─────────────┐
│   React     │ ◄──────────────► │   NestJS    │ ◄────────────► │  FastAPI    │
│  Frontend   │                   │   Backend   │                │ AI Service  │
└─────────────┘                   └──────┬──────┘                └─────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   MongoDB   │
                                    └─────────────┘
```

## Service Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Frontend** | UI, audio playback, Web Audio waveform, speech-to-text |
| **Backend** | Auth, CRUD, file uploads, orchestration of AI calls |
| **AI Service** | Stem separation, mood NLP, remix merging, recommendations |
| **MongoDB** | Users, songs, playlists, remixes, mood history |

## Future: Real-Time Collaboration

Planned extension points:

1. **WebSocket Gateway** (`JamGateway` in NestJS) for live jam sessions
2. **Room state** in Redis — playhead sync, queue, participants
3. **Shared playlists** — optimistic updates via room events
4. **Friend invites** — notification service + presence channel

Module stubs can live under `backend/src/realtime/` without breaking existing REST flows.
