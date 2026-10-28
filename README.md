# Rewind Player

Rewind Player is a music player client for a marketplace-backed music service. Users sign in with Keycloak, browse a catalog, and play tracks they have access to — access is granted as a "stake" purchased on the marketplace. Unlocked tracks stream instantly; locked tracks prompt to buy, and unlock as soon as the stake lands.

## Repository layout

- `rewind-player-mobile/` — the React Native client (Expo SDK 58, TypeScript)
- `client_migrate.md` — the migration spec: predecessor behavior, API contracts, and the phased build plan

## The mobile app

- **Architecture** — hexagonal, one-way dependency rule enforced by `eslint-plugin-boundaries`: `core` (pure domain + use-cases, no React), `adapters` (platform implementations of the core ports), `features` (screens and hooks), `app` (composition root), `shared` (UI primitives).
- **Playback** — a pure reducer in `core/domain/queue.ts` drives a Zustand store; an `AudioEngine` port isolates `expo-audio` behind `src/adapters/`. Persistent mini player, expandable now-playing modal, tap-to-seek, shuffle/repeat.
- **State** — TanStack Query for server state, Zustand for playback state.

## Configuration

All runtime configuration comes from build-time env vars (baked into the bundle; they are public values). Copy `.env.example` to `.env` and set:

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Player API origin, including the `/api/v1` prefix |
| `EXPO_PUBLIC_KEYCLOAK_URL` / `_REALM` / `_CLIENT_ID` | OpenID Connect discovery + public PKCE client |
| `EXPO_PUBLIC_MARKETPLACE_URL` | Marketplace deep links and player provisioning; falls back to `https://market.rewind-music.com` when unset |

The app assumes **Keycloak** for authentication (open source and self-hostable). A different auth system means implementing the `AuthGateway` port — a single adapter file — nothing else changes.

## Running against your own backend

The client is backend-agnostic by design: `core/` depends only on the port interfaces (`ApiClient`, `AuthGateway`, `AudioEngine`, …), never on a concrete implementation. To run against your own server, implement the API contract in `client_migrate.md` §3 and point `EXPO_PUBLIC_API_BASE_URL` at it — or use the mock adapter in `src/adapters/mockApiClient.ts` as a working reference implementation of the contract. The lint-enforced dependency rule keeps any backend-specific code out of `core/` and `features/`.

## Getting started

```bash
cd rewind-player-mobile
npm install
cp .env.example .env   # public build-time values (EXPO_PUBLIC_*)
npm run android        # dev build via expo run:android
```

## License

Licensed under **Creative Commons Attribution-NonCommercial 4.0 International** — free to use, share, and adapt for non-commercial purposes with attribution. **Commercial use requires our explicit permission**; contact us for a commercial license.

## Checks

```bash
npm run typecheck
npm run lint
npm test               # vitest core unit tests
```
