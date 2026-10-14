# Curbsport frontend integration contract

**Scope:** this project is a frontend only. It does not create or modify an Express server, database, or backend deployment. The UI reads `NEXT_PUBLIC_API_URL` and optionally `NEXT_PUBLIC_SOCKET_URL` from its frontend environment and calls the existing Express/Socket.IO service only when configured. Never put private credentials in `NEXT_PUBLIC_*` variables.

## REST adapter expectations

Responses use the `Pitch` / `SetLobby` / `Player` shapes in `lib/types.ts`. Pitch feed accepts either `Pitch[]` or `{ "data": Pitch[] }`; pitch detail accepts a single `Pitch` or `{ "data": Pitch }`. Malformed or incompatible payloads are not treated as live data. The browser adapter currently expects these routes:

| Method | Path | Frontend use |
| --- | --- | --- |
| GET | `/pitches?campusId={id}&sport={sport}` | Campus radar snapshot |
| GET | `/pitches/{id}` | Optional pitch detail lookup seam |
| POST | `/sets` | Create a set |
| POST | `/sets/{id}/join` | Join an open set |
| PUT | `/ground-beacons` | Publish/clear “I have a ball today” |
| POST | `/matches/{id}/confirm` | Opponent confirmation |
| POST | `/matches/{id}/dispute` | Dispute/slash request |
| POST | `/users/me/biometrics` | Private profile update |
| POST | `/pitches` (multipart form) | Drop a pin with optional photo |

Where `curbsport-token` exists, requests send `Authorization: Bearer <token>`; if absent the existing `inside-life-token` is read without deleting it. An explicit logout clears both keys. A successful write is shown only after a successful HTTP response. If `NEXT_PUBLIC_API_URL` is empty, demo fixtures are shown and write attempts are explicitly marked as preview-only/not submitted.

The routes above are frontend adapter assumptions because the product brief did not include the existing Express route inventory or response schema. If the deployed API differs, update `lib/api.ts` to match it; no backend changes are implied by this document.

## Socket.IO adapter expectations

The frontend connects only when an endpoint is configured. It sends the current compatible auth token in the Socket.IO `auth.token` field and listens for:

- `sets:update`: `{ "pitchId": string, "sets": SetLobby[] }`
- `ground:update` and `ground:condition`: `{ "pitchId": string, "status"?: "live" | "building" | "quiet", "liveCount"?: number, "ballPresent"?: boolean, "ballBroughtBy"?: string, "condition"?: string, "updatedMinutesAgo"?: number }`

These event names/payloads are provisional adapter assumptions, not claims about the existing service. The browser validates relevant fields before applying updates. Without the Socket.IO origin or a successful connection the client keeps the last snapshot and says so.
