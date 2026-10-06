# Inside Life: Sports Edition — Frontend

Mobile-first Next.js 14 frontend for a hyper-local street-football pitch directory and matchmaking app for Anambra State, Nigeria. The project lives in `client/`; no Express, Prisma, or other backend code is included.

## Stack

- Next.js 14 App Router, React 18, TypeScript
- Tailwind CSS
- Zustand auth state (JWT in browser localStorage)
- SWR data fetching
- Lucide React icons

## Run locally

Requirements: Node.js 20+ and pnpm 11.25.0 (pinned in `client/package.json`). From the repository root:

```sh
pnpm install
cp client/.env.example client/.env.local
pnpm --filter inside-life-client dev
```

Open `http://localhost:3000`. The backend must be reachable by the browser at `http://localhost:4000/api` (or set `NEXT_PUBLIC_API_URL`). If the frontend runs on another machine/container, `localhost` refers to that runtime, not the API host. The Express server must allow the frontend origin through CORS.

## Backend integration notes

The API helper sends JSON and, when available, `Authorization: Bearer <token>` from `localStorage` on every protected request. The frontend consumes the routes provided in the brief. Where request/response shapes were not included, the client uses documented conventional payloads that can be adjusted in `client/src/lib/api.ts`:

- Login/register: `phone`, `password` and (for registration) `name`.
- Banter create: `{ pitchId, message }`.
- Lobby create: `{ pitchId, startsAt, maxPlayers, note }`; join: `{ lobbyId, action: "join" }` via `POST /lobbies`.
- `GET /pitches?cityId=` needs a city ID, but no cities endpoint/ID mapping was supplied. Configure `NEXT_PUBLIC_DEFAULT_CITY_ID` or set the City ID in Profile. The UI labels the active value rather than inventing a mapping from city names.
- The supplied backend contract does not include pitch creation or map-geocoding endpoints. Add Pitch therefore saves a clearly labelled browser-local draft and does not claim it was published. The map and pitch hero use an original visual placeholder, not real map coordinates.

When the API is unavailable, the Feed and pitch detail page show clearly labelled sample preview data. A zero-result API response remains a true empty state. Sample IDs (`demo-*`) are not sent to the backend for voting, lobbies, or chat.

## Routes

- `/` Feed
- `/map` Map preview
- `/add` Add Pitch draft
- `/profile` Profile and city ID setting
- `/login`, `/register` Authentication
- `/pitches/:id` Pitch details (INFO / SETS / BANTER)

## Checks

```sh
pnpm --filter inside-life-client typecheck
pnpm --filter inside-life-client lint
pnpm --filter inside-life-client build
```

No secret is required in the frontend. `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_DEFAULT_CITY_ID` are public client configuration only; do not put server credentials in `NEXT_PUBLIC_*` variables.
