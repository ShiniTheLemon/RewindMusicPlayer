# Rewind Player

Rewind Player is a music player client for a marketplace-backed music service. Users sign in with Keycloak, browse a catalog, and play tracks they have access to — access is granted as a "stake" purchased on the marketplace. Unlocked tracks stream instantly; locked tracks prompt to buy, and unlock as soon as the stake lands.

## Repository layout

- `rewind-player-mobile/` — the React Native client (Expo SDK 58, TypeScript)
- `client_migrate.md` — the migration spec: predecessor behavior, API contracts, and the phased build plan

## The mobile app

- **Architecture** — hexagonal, one-way dependency rule enforced by `eslint-plugin-boundaries`: `core` (pure domain + use-cases, no React), `adapters` (platform implementations of the core ports), `features` (screens and hooks), `app` (composition root), `shared` (UI primitives).
- **Playback** — a pure reducer in `core/domain/queue.ts` drives a Zustand store; an `AudioEngine` port isolates `expo-audio` behind `src/adapters/`. Persistent mini player, expandable now-playing modal, tap-to-seek, shuffle/repeat.
- **State** — TanStack Query for server state, Zustand for playback state.
- **Backend** — currently served by an in-memory mock API (`src/adapters/`); the real HTTP adapter and auth land in Phase 3 per the spec.

## Getting started

```bash
cd rewind-player-mobile
npm install
cp .env.example .env   # public build-time values (EXPO_PUBLIC_*)
npm run android        # dev build via expo run:android
```

## Checks

```bash
npm run typecheck
npm run lint
npm test               # vitest core unit tests
```
