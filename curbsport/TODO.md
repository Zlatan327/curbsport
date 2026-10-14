# Curbsport delivery outcomes

## 1. Product scope, visual identity, and shared application shell
- Curbsport (formerly Inside Life Sports Edition) is a hyper-local, real-time pickup sports ground radar, matchmaking lobby, and player reputation platform built for university campuses and grassroots streetball communities across Nigeria (UNILAG, UNIZIK, OAU, UNN, ABU, Covenant, UI, and more).
- Curbsport digitizes grassroots pickup sports by combining live ground condition radar with real-time matchmaking lobbies, an automated squad balancer, and a peer-verified reputation economy.
- Brand Name: CURBSPORT (Wordmark lockup: `CURB` `SPORT / NG`).
- Tagline: Live Pickup Sports & Ground Radar.
- Aesthetic: Modern Athletic Street & Stadium. Think Nike Training Club meets Strava meets Sofascore.
- Primary Surface: `#111311` (Deep Asphalt); Layered Elevations: `#191C19` (Surface-1) and `#252925` (Surface-2); Accent / Turf: Neon Turf Green (`#00FF66`) for live ball radar and action buttons; Accent / Caution: Golden Amber (`#FFD700`) for King crowns, cautions, and pending sets; Text & Accents: Chalk White (`#F0F0E8`), Muted Smoke (`#8B908A`), crisp 1px borders (`rgba(240, 240, 232, 0.15)`).
- Typographic System (Strictly Ban Micro-Fonts < 11px): Display / Headings / Scores use “Oswald” or “Barlow Condensed” strictly for scoreboard stats, reputation ratings, King titles, and large card headings, always with generous tracking. Interface / Body / Tables / Forms use “Plus Jakarta Sans” or “Geist” for all navigation, form controls, timestamps, player rosters, and body copy.
- Scale Hierarchy: Title Hero 28px–36px (Oswald Bold); Section Headings 18px–22px (Oswald Medium); Subheadings & Cards 14px–16px (Plus Jakarta Sans SemiBold); Regular UI & Body 13px–14px (Plus Jakarta Sans Regular); Status Badges & Pill Tags 11px uppercase with 0.08em letter-spacing (SemiBold).

## 2. Responsive desktop workbench and search
- Desktop Viewport (Width >= 1024px) — The Dual-Pane Workbench: NO mobile bottom navigation bar on desktop.
- Sticky Desktop Topbar: Brand lockup “CURB SPORT / NG”; Searchable Campus Combobox (quickly switch between UNIZIK, UNILAG, OAU, etc.); Sport Toggle: segmented control [⚽ Football] / [🏀 Basketball]; Action Cluster: “Drop a Pin” button, Active Sets counter, and User Profile badge with ⭐ REP score.
- Split-Screen Layout: Left Pane (58% Scrollable): high-density live pitch feed, status filter pills (`LIVE BALL`, `BUILDING`, `KING ACTIVE`), and pickup lobbies with live player rosters. Right Pane (42% Sticky): interactive campus ground map with color-coded pulsing pins, surface condition indicators (Turf, Red Sand, Concrete, Floodlights), and a quick-action drawer for the selected pitch.
- Global Command Palette: `Cmd+K` / `Ctrl+K` for instant ground, player, and campus search.

## 3. Mobile PWA experience and interactions
- Mobile Viewport (Width < 1024px) — Native PWA Experience: full-bleed native mobile layout (100vw, no artificial desktop borders or empty side gaps).
- Sleek floating bottom navigation bar with active turf indicator.
- Pull-to-refresh and smooth bottom sheet drawers for ground inspection, match lobbies, and squad balancing.

## 4. Campus Ground Radar and live feed (`/`)
- Campus selector and sport toggle.
- Ground cards featuring: Surface type, “Ball Dey Ground” status beacon, active lobby countdown, and current King of the Ground avatar.
- Quick “I have a ball today” toggle for players heading to the pitch.
- Campus Ground Radar: interactive map of verified and community-discovered football pitches and basketball courts per university campus.
- “Ball Dey Ground” Live Beacon: real-time indicator showing if people are actively playing, if a match ball is present on-site, and who brought it.
- Matchmaking Lobbies (“Sets”): Hosts create pickup sessions (e.g., “5-a-side at Moremi Car Park, 4:30 PM”). Ballers join sets in real-time, broadcast campus-wide via WebSockets.

## 5. Pitch Detail and King Headquarters (`/pitches/[id]`)
- High-impact header with verified tag, surface specs, and location landmark description.
- Crown Banner: “King of the Ground” profile with seasonal goals/assists and win rate.
- Active Lobbies & Set Builder: join open set, view player list, and 1-tap “Balance Squads for WhatsApp” button.
- Match Results & Peer Confirmation Table: pending match results awaiting peer approval, with dispute/slash action buttons.
- Automated Squad Balancer: generates balanced Team A vs Team B rosters based on player positions and peer reputation scores, formatted for 1-click sharing to WhatsApp and Telegram group chats.
- “King of the Ground” & Peer Verification: players log post-match stats (Goals, Assists, Rebounds, 3-Pointers). Opponents must confirm submissions. The top-rated player on each pitch is crowned “King of the Ground”.
- Anti-Cheat Slashing: fraudulent stat submissions can be disputed and “slashed” by match opponents, deducting reputation points and temporarily revoking crown eligibility.

## 6. Player Profile and Locker Room (`/profile`)
- Player card: alias, campus, primary sport, favorite position, biometrics (height/weight), and reputation tier (Rookie → Baller → Campus Legend).
- Match history timeline with verified stat breakdown.
- Private biometrics update form.

## 7. Drop a Pin (`/add`)
- Clean 2-step ground registration with map coordinate placement, photo upload, surface type picker, and notes for players.

## 8. Technical stack, session compatibility, real-time integration, and performance
- Framework: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React icons.
- State & Auth: Zustand auth store with dual-key storage fallback (`curbsport-token` with fallback to `inside-life-token` so existing user sessions are never logged out).
- Backend API: connects to existing Express server (`process.env.NEXT_PUBLIC_API_URL`).
- Real-time: Socket.IO listeners for live lobby updates and ground condition notifications.
- Performance: optimized Next.js font loading, zero layout shifts, responsive SVG icons, and clean SEO metadata.
