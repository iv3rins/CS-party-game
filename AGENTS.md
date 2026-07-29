# Project Instructions

## Product boundary

- This repository contains the CS Party Arena shell and the `cs-career` single-player career simulator.
- `cs-career` uses `gameId: 'cs-career'`, `seasonId: 'career-v1'`, and route `/games/cs-career`. These identifiers are persistent API partition keys.
- The career game is deterministic per seed. Game simulation must not call `Math.random()`; inject or persist the seed and use the career engine's seeded RNG.
- **`cs-career` is strictly single-player.** It must not implement matchmaking, multiplayer lobbies, rooms, or any form of cross-player interaction. All multiplayer infrastructure belongs to the lobby and platform adapter.

## Platform integration

- Read and follow [docs/platform-api.md](docs/platform-api.md) before changing platform-facing behavior.
- **Lobby (`src/lobby/Lobby.tsx`) and platform adapter (`src/platform.ts`) are the only owners of multiplayer infrastructure**: account identity, matchmaking, queues, rooms, ratings, leaderboards, match history, and cross-player interaction.
- **Single-player games must not implement their own multiplayer, matchmaking, lobbies, or room systems.** They may only:
  - Read static game manifest metadata via `platform.listGames()`
  - Launch the game via `platform.launchGame(gameId)`
  - Leave to lobby via `platform.leaveToLobby()`
  - Read account display name and preferences for UI personalization
- Single-player career saves are local game data, separate from platform ratings, queues, rooms, and match records.
- Multiplayer games (e.g., `cs-push`) integrate with the platform through `platform.startMatch()`, `platform.completeMatch()`, `platform.joinQueue()`, `platform.createRoom()`, and `platform.joinRoom()`. The lobby coordinates these flows; individual game pages do not reimplement matchmaking or room UI.

## Code conventions

- Keep simulation logic framework-free in `src/careerEngine.ts`; components consume pure engine transitions.
- Persist versioned career saves under a dedicated `localStorage` key. Treat malformed saves as absent rather than crashing.
- Add or update focused Vitest coverage for engine transitions and platform manifest behavior.
- Do not change unrelated games merely to make `cs-career` work.
- Use Chinese UI copy. `cs-career` may use the versioned static real team/player snapshot in `src/careerData.ts`; tournament organizers, tournament brands, sponsors, generated people, and generated events must remain clearly fictional. Never fetch live roster data at runtime.

## Design and verification

- Follow [design.md](design.md) and [docs/games/cs-career/RULES.md](docs/games/cs-career/RULES.md).
- Prefer accessible semantic controls and keyboard-focusable interactive elements.
- Before completion, run `npm run lint`, `npm test`, and `npm run build`.
