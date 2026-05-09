# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo with two largely-independent projects:

- `frontend/` — Vite + React 18 + TypeScript + Chakra UI app (port 8000). The currently active surface.
- `backend/` — FastAPI app (port 8080) using Poetry, structured as domain / application / infrastructure layers. Reads OggDude XML out of `backend/data/oggdude/` and exposes it under `/data/...`.
- Top-level `package.json` is a thin convenience wrapper that proxies `dev` / `build` / `preview` / `build:spotlight` into `frontend/`.

The frontend does **not** currently call the backend at runtime. The data the UI needs is baked in at build time by `frontend/scripts/buildSpotlightIndex.mjs`, which reads `backend/data/oggdude/*.xml` and writes `frontend/src/data/spotlightIndex.generated.json`. There is a Swagger client generator (`npm run gen`) that emits into `frontend/src/generated/`, but that directory is git-ignored and not currently checked in or imported.

## Common commands

From the repo root:

```bash
npm run dev              # installs frontend deps and starts Vite on :8000 (runs predev → build:spotlight)
npm run build            # tsc + vite build (runs prebuild → build:spotlight)
npm run build:spotlight  # regenerate frontend/src/data/spotlightIndex.generated.json from backend/data/oggdude
docker-compose up        # frontend on :8000, backend on :8080
```

Frontend (`cd frontend`):

```bash
npm run dev              # Vite dev server
npm run build            # type-check + production build
npm run gen              # regenerate Swagger client from src/generated/openapi.json
```

There is no lint or test script wired up on the frontend.

Backend (`cd backend`):

```bash
poetry install
poetry run python -m holocron.app                # starts uvicorn on 0.0.0.0:8080
poetry run pytest                                # all tests
poetry run pytest test/test_data_controller.py::test_weapon   # single test
```

Backend tests use `pytest-anyio` and spin up the FastAPI app via `httpx.AsyncClient` — they exercise real route wiring, not mocks.

## Architecture notes that aren't obvious from a single file

### Backend: dependency-injector + repository pattern

`holocron/container.py` declares a `dependency-injector` `ApplicationContainer` that loads `config.yml` and wires `DataFileRepository` → `DataService`. Routes (`infrastructure/api/data_controller.py`) declare `data_service: DataService = Provide[ApplicationContainer.data_service]` at module scope; `infrastructure/api/setup.py` calls `container.wire(modules=[...])` to make those `Provide` markers resolve. **Adding a new controller requires adding it to both `setup.py`'s `include_router` call and its `wire` modules list**, otherwise injection silently breaks.

Domain models live in `holocron/domain/` and are separate from the FastAPI response schemas in `holocron/infrastructure/api/*_schema.py`. `DataService.webify()` is the convention for converting a list of domain objects into the schema variant via a `from_X` classmethod.

OggDude XML parsing is funneled through `infrastructure/database/file/oggdude2.py` (helper `oggdude2000(filename)`) and assembled by `application/oggdude_builder.py` + `domain/oggdude/oggdude_mod_builder.py`. `DataFileRepository` aggressively `@cache`s the parsed lists — it's effectively read-only after construction.

On startup, `app.py` writes the OpenAPI spec to `../../frontend/src/generated/openapi.json` *unless* it detects it is running inside Docker. That file is the input to the frontend's `npm run gen`.

### Frontend: zustand stores + a hand-rolled FSM

State is split across small zustand stores in `src/state/`: `participantsStore`, `encountersStore`, `effectStore`, `destinyPoolStore`, `gameplayStore`, `newGameplayStore`, `pocketedResultsStore`, `spotlightStore`, plus `FSMStore` wrapping `FSM.ts`.

`FSM.ts` is a custom finite-state machine (not xstate) with two layers:
- `MainState`: `idle | preparation | inProgress | completed` — the encounter lifecycle.
- `TurnState` (lives on `EncounterContext.turnState`): `turn_start | turn_active | turn_end | null` — the per-turn sub-flow that drives effect application.

Transitions in `inProgress` mutate `turnState` directly inside their `action` rather than transitioning between top-level states. There is also a parallel event bus (`state/eventSystem.ts`) — FSM transitions emit `TURN_START` / `TURN_ACTION` / `TURN_END` / `ROUND_*` events that effect-related stores subscribe to. Several `eventSystem.emitGameEvent('ROUND_*')` calls inside `FSM.ts` are intentionally commented out because `gameplayStore` is the source of truth for round events — keep that split in mind before re-emitting from the FSM.

There are duplicate-looking files: `ContentCardActive.tsx` vs `ContentCardActiveOld.tsx`, `gameplayStore` vs `newGameplayStore`. `App.tsx` currently renders the `Old` variant — both are live; do not assume the non-`Old` one is the only one in use.

### Spotlight (in-app search)

`Spotlight.tsx` (Cmd/Ctrl+K) is backed by `src/data/spotlightIndex.ts`, which merges:
1. `spotlightIndex.generated.json` — produced from OggDude XML by `frontend/scripts/buildSpotlightIndex.mjs` at `predev` / `prebuild` time.
2. `spotlightExtras.json` — hand-curated overrides/additions, merged by `${type}:${id}` (extras win).

If `backend/data/oggdude/` is missing, the build script keeps any existing generated JSON rather than wiping it (see the `safeRead` / fallback block in `buildSpotlightIndex.mjs`). Override the source location with `OGGDUDE_DIR` / `OGGDUDE_DATA_DIR`.

When adding a new entity type to the index, mirror the existing pattern: parse the XML, normalize via the `entry()` helper, dedupe with `push()`, and add the type string to the `allTypes` array in `Spotlight.tsx`.

### Path aliases

`@/*` → `frontend/src/*`, `@components/*` → `frontend/src/components/*` (configured in both `tsconfig.json` and `vite.config.ts` — keep them in sync).

## Deployment

`.github/workflows/deploy-{frontend,backend}.yml` build Docker images on a self-hosted runner and run them on fixed host ports (`32782` for frontend, `32781` for backend per the README). Pushing to `master` triggers deploys; touching only `backend/**` or only `frontend/**` triggers just that side.
