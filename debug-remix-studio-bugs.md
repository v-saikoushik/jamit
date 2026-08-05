# Debug Session: remix-studio-bugs

## Status
- [OPEN] Inspection and runtime evidence collection started.

## Scope
- Remix Studio button wiring
- Trim integration
- Merge integration
- Existing library tracks in Remix Studio
- Duplicate filename upload handling
- Audio playback and streaming URLs

## Initial Hypotheses
1. Remix Studio contains UI-only controls that are not bound to existing NestJS/FastAPI endpoints, so they appear interactive but do not trigger real functionality.
2. Existing library tracks are not appearing in Remix Studio because the page only loads a filtered subset of songs or does not maintain a workspace state for library items.
3. Duplicate upload failures are caused by a MongoDB unique index or schema/service logic tied to filename-derived fields such as `title`, stored filename, or original name.
4. Trim and merge backend capabilities already exist in FastAPI, but there is no NestJS bridge or no frontend API utility connected to those routes.
5. Playback issues occur because some Remix Studio items store filesystem paths instead of HTTP streamable URLs, or generated outputs are not exposed through NestJS streaming endpoints.

## Evidence Log
- Pending repository inspection.
- Pending runtime verification.

## Notes
- No business logic changes made yet.
