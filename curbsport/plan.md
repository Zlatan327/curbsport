# Curbsport — Implementation & Design Plan

## Product scope

Build a complete, responsive Curbsport frontend for campus pickup football and basketball: campus ground radar/feed, ground detail and King of the Ground headquarters, player profile/locker room, and two-step Drop a Pin flow. The application must preserve the specified Nigerian campus context, real-time pickup-set and ball-presence concepts, squad balancing/share, peer verification/disputes, player reputation, responsive layouts, and Next.js 14 App Router / TypeScript / Tailwind / Lucide React stack.

## Implementation approach

- Start from the initialized, empty managed web project. Pin a Node package manager in project metadata and prepare an explicit lifecycle-script policy before dependency installation. Use Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React, Zustand and Socket.IO client; use stable font loading for Oswald and Plus Jakarta Sans (with CSS fallbacks) to avoid layout shift.
- Render meaningful page content from the first response where practical, with separate routes for `/`, `/pitches/[id]`, `/profile`, and `/add`; provide route-appropriate metadata and a `public/manus-routes.json` manifest before starting the development server.
- Keep product data and integrations outside presentation components: typed domain models and seeded demo fixtures; an API client based on `NEXT_PUBLIC_API_URL`; a Zustand auth store that checks `curbsport-token` first and falls back to `inside-life-token` without deleting or overwriting a usable legacy session; and a Socket.IO client for live set/ground updates. Do not place secrets in browser code. Because the brief supplies neither a backend URL nor endpoint/event schemas, use safe demo fixtures and an isolated adapter with clearly documented endpoint/event assumptions when no backend is configured; never imply a backend write succeeded when it did not. Use optimistic UI only where an explicit recoverable fallback exists.
- Build a clickable, lightweight SVG campus-ground schematic (rather than claiming unprovided precise GIS data) with selectable, pulsing pitch pins, visible surface/floodlight cues and a selected-pitch quick-action panel. Provide campus switching, sport switching, search, feed filters, command palette, ball-availability toggle, set join/create flows, and clear empty/error/loading feedback. The map is a product interface, not a decorative image.
- Keep the 58% live feed and 42% sticky map workbench at desktop widths (>=1024px), with no desktop bottom navigation. At smaller widths use edge-to-edge layout, mobile bottom navigation, and touch-friendly bottom sheets/drawers. Respect reduced-motion preferences and make keyboard focus, controls and dialogs accessible.
- Implement squad balance from the displayed position/reputation data with deterministic, explainable assignment; expose a one-tap WhatsApp/Telegram share action using shareable text. Show peer confirmation, dispute/slash controls as demo interactions unless a real configured endpoint confirms a write.
- The Drop a Pin flow is two-step: location/coordinate placement, then image preview upload, surface selection and player notes, with validation and status feedback. The profile includes a private biometrics form with explicit saved-state feedback; match history and peer verification remain visible.
- Treat all demo values as illustrative sample content, not verified live campus activity or real player reputation. State connection/demo status in the interface. Preserve the dual-key auth migration behavior.

## Design direction

- **Design movement:** athletic street-sport control room, borrowing the contrast and precision of a stadium scoreboard and a live training dashboard.
- **Core principles:** 1) show what is happening now before secondary detail; 2) turn status into high-contrast, glanceable signals; 3) keep every important action close to its pitch/player context; 4) work naturally with one hand on a phone and a keyboard/mouse at a workstation.
- **Color philosophy:** deep asphalt `#111311` establishes a night-pitch canvas; `#191C19` and `#252925` separate elevations without losing dark-mode focus; chalk `#F0F0E8` carries legibility; smoke `#8B908A` recedes secondary detail; neon turf `#00FF66` is reserved for live/available/action states; amber `#FFD700` distinguishes crown, pending and caution states. Use crisp `rgba(240, 240, 232, 0.15)` borders.
- **Layout paradigm:** desktop split-pane operations workbench, dense vertically scrolling pitch feed on the left and persistent interactive ground schematic on the right; mobile switches to a full-bleed single-column feed with floating turf-marked navigation and native-feeling sheets.
- **Signature elements:** a neon radar ring around live pitch pins; scoreboard-style condensed numerals with tracked uppercase status chips; an amber crown/king banner paired with minimal angular pitch markings.
- **Interaction philosophy:** fast, local, contextual actions (join, pin, balance, share, report) with immediate acknowledgement, reversible choices where possible, explicit pending/success/failure states, and no hidden destructive/slashing action.
- **Animation:** restrained 1–2 second radar pulse for live pins; 150–220ms hover/focus/sheet transitions; subtle countdown/status changes; no continuous motion for non-live data; pause/reduce motion for `prefers-reduced-motion` and avoid animating large layout shifts.
- **Typography system:** Oswald for hero/section headings, scoreboard/reputation/King metrics; Plus Jakarta Sans for UI/body; `font-display: swap` with metric-compatible fallback. Hero 28–36px, section 18–22px, cards 14–16px, body 13–14px, badges >=11px uppercase with 0.08em tracking. Never use type below 11px.
- **Brand essence:** live ground intelligence for Nigerian campus ballers, combining proof of activity, matchmaking and peer reputation in one pitch-side tool. Personality: energetic, street-smart, credible.
- **Brand voice:** direct, local and action-led; status copy says what is happening, CTAs say what the player can do. Examples: “Ball dey ground. Pull up.” “Two spots left — balance the sides.”
- **Wordmark & logo:** custom compact “CURB / SPORT” lockup with a pitch-corner/radar-mark motif and small `NG` signature, constructed as a reusable inline SVG rather than default text styling.
- **Signature brand color:** neon turf green `#00FF66`.

## Project structure

- `app/`: root layout, global styles, metadata, homepage, and route segments for pitch detail, profile and add-pitch.
- `components/`: brand/topbar, campus and sport controls, live-feed cards/filters, ground map and selected-pitch drawer, command palette, mobile navigation/sheets, squad balancer, match verification, and form primitives.
- `lib/`: typed models, fixture data, campus/pitch selectors, API client, Socket.IO lifecycle, squad balancing/share helpers, formatting and validation.
- `store/`: Zustand auth/session store and local demo interaction state.
- `public/`: route manifest, application/favicon assets, and local static assets.
- `docs/`: the explicit frontend REST and Socket.IO integration contract, including assumptions that remain unverified.
- Root configuration: pinned package/toolchain settings, Tailwind, TypeScript, Next.js, ignored build output and project `app.config.ts` metadata.

## Serving, integration assumptions, and constraints

- Preview runs the normal Next.js development server on the project's configured port 3000, bound to `0.0.0.0`. The production build sets `CURBSPORT_STATIC_EXPORT=1` and writes a static export to `out/`, served independently of the existing Express service; the managed build command will pin pnpm, install from the committed lockfile and run that build. Keeping static export off in `next dev` avoids Next.js 14's export-mode dynamic-route guard in Preview.
- The existing Express/Socket.IO service is external to this frontend. The API URL, exact Express endpoint inventory, socket payload contract, map-tile key, existing component source, and real campus ground coordinates were not supplied or configured in this project environment. The delivery provides an explicit configurable client seam plus a coherent, clearly labeled demo-data experience; integration cannot be represented as production-live until those external contracts and browser-safe configuration are supplied. A schematic campus map must not be presented as a precision navigation map.
- Public SEO metadata may use the project title/description and route-specific descriptions, but canonical/OG absolute URLs must be omitted until a real public origin is known. Public routes must not leak private biometrics or auth data.
- Use the host-managed TypeScript diagnostics after verifying registration. Validate with project lint/typecheck/build commands and targeted route/manifest checks, then review connected components and source against the brief. Do not run tests that mutate a managed production database.
