# Remix Studio Bug Fix — Progress Tracker

## Backend
- [x] Song schema: added `originalName`, `storageKey`, `sourceType`, `sourceSongId`
- [x] SongsService: `create` stores originalName/storageKey/sourceType; added `trimAudio` and `mergeAudio`
- [x] AiService: added `trimAudio` and `mergeAudio` (bridge to FastAPI `/api/audio-editor/*`)
- [x] SongsController: added `POST /songs/:id/trim`, `POST /songs/merge`, `GET /songs/:id/stem`
- [x] DTOs: added `TrimSongDto`, `MergeSongsDto` with validation
- [x] Verify backend compiles (tsc) — PASS

## Frontend
- [x] api.ts: added `trim`, `merge`, `stemStreamUrl` to songsApi
- [x] playerStore: Track type supports `clip`
- [x] RemixStudio: full rewrite wiring library tracks, upload, trim, merge, playback, export
- [x] Verify frontend compiles (tsc -b) — PASS

## Testing (manual/runtime)
- [ ] Start backend + ai-service + mongodb
- [ ] Test 1 — Existing library tracks appear
- [ ] Test 2 — New upload creates MongoDB record + appears + plays
- [ ] Test 3 — Duplicate filename upload succeeds
- [ ] Test 4 — Trim produces playable output
- [ ] Test 5 — Merge produces playable output
- [ ] Test 6 — Persistence after refresh
- [ ] Test 7 — Invalid operations show meaningful errors
