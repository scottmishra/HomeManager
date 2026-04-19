# HomeManager — Claude Context

## What This App Does

HomeManager is a full-stack AI-powered home maintenance platform. Users register their homes and appliances, and AI agents (CrewAI + Claude) generate maintenance schedules, answer how-to questions, and process uploaded manuals/warranties via RAG.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind, Zustand |
| Backend | FastAPI (Python 3.11), Uvicorn |
| Database / Auth | Supabase (PostgreSQL + pgvector + Auth) |
| AI Orchestration | CrewAI 0.80 → LangChain-Anthropic → Claude Sonnet 4 |
| AI (prototype) | Claude Agent SDK → local `claude` CLI |
| HTTP client | httpx (async) |
| Package manager | uv |

---

## Directory Structure

```
HomeManager/
├── backend/
│   ├── main.py                        # FastAPI app, router registration
│   ├── core/
│   │   ├── config.py                  # Pydantic settings (reads .env)
│   │   ├── auth.py                    # Supabase JWT verification dependency
│   │   └── supabase_client.py         # Supabase client factory
│   ├── models/
│   │   ├── home.py                    # Home, HomeCreate, HomeUpdate, HomeType
│   │   ├── appliance.py               # Appliance, ApplianceCreate, ApplianceCategory
│   │   ├── maintenance.py             # MaintenanceTask, TaskFrequency, TaskPriority
│   │   └── agent_models.py            # AgentRequest, AgentResponse, AgentAction
│   ├── api/routes/
│   │   ├── homes.py                   # CRUD /api/v1/homes
│   │   ├── appliances.py              # CRUD /api/v1/appliances
│   │   ├── maintenance.py             # CRUD /api/v1/maintenance/tasks
│   │   ├── agent.py                   # /api/v1/agent/chat, /api/v1/agent/document
│   │   └── prototype.py              # /api/v1/prototype/chat (Claude Agent SDK)
│   ├── agents/
│   │   ├── orchestrator.py            # Routes AgentAction → correct CrewAI crew
│   │   ├── crews/home_crew.py         # CrewAI crew definitions (4 agents)
│   │   └── tools/
│   │       ├── supabase_tools.py      # LangChain tools: list/create/update Supabase records
│   │       └── rag_tools.py           # LangChain tool: semantic search over document chunks
│   ├── rag/
│   │   ├── processor.py               # Upload → chunk → embed → store in pgvector
│   │   └── retriever.py               # Semantic search against document_chunks table
│   └── services/
│       ├── home_service.py            # DB ops for homes
│       ├── appliance_service.py       # DB ops for appliances
│       ├── maintenance_service.py     # DB ops for maintenance tasks
│       └── claude_sdk_service.py      # Claude Agent SDK wrapper (prototype)
├── frontend/
│   ├── src/
│   │   ├── lib/api.ts                 # Typed fetch wrapper, injects Supabase JWT
│   │   ├── stores/agentStore.ts       # Zustand: agent chat state
│   │   ├── components/agent/          # ChatInterface, MessageBubble, ActionSelector
│   │   └── pages/                     # Home pages, Dashboard, etc.
│   └── .env                           # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── tests/
│   └── test_models.py                 # Pydantic model validation (pytest)
├── cli.py                             # Rich interactive CLI for API testing (see below)
├── .env                               # Backend env vars (see Environment section)
└── pyproject.toml                     # Python deps, managed with uv
```

---

## Environment Variables

**`.env`** (project root, read by backend):
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...          # Required for CrewAI agent calls
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:5173
```

**`frontend/.env`**:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

---

## Starting the Application

```bash
# Backend
uv sync                                 # install/update deps
uvicorn backend.main:app --reload       # http://localhost:8000

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev                                # http://localhost:5173

# API docs (when backend is running)
open http://localhost:8000/docs         # Swagger UI — all endpoints, try them live
```

---

## Production Deployment (Teleport)

HomeManager runs on `raspberrypi53` behind the Teleport cluster at `teleport.mishrahome.boo`, accessible at `https://homemanager.teleport.mishrahome.boo`.

**Auth model — two layers:**
1. **Teleport** (gateway): All unauthenticated requests redirected to Teleport login. Injects `Teleport-Jwt-Assertion` header into every proxied request.
2. **Supabase** (app-level): Existing login page and Supabase Auth flow for user identity and DB operations.

### Infrastructure

| Component | Host | Details |
|-----------|------|---------|
| Teleport hub | `raspberrypi51` | Runs `teleport` container via docker-compose |
| App host | `raspberrypi53` | Runs HomeManager containers + Teleport agent |
| App URL | `homemanager.teleport.mishrahome.boo` | Proxied through Teleport `app_service` |

### Deployment Script

```bash
# From project root on your laptop — reads secrets from .env automatically
bash ansible/deploy.sh

# Flags
bash ansible/deploy.sh --check           # Ansible dry-run (no changes made)
bash ansible/deploy.sh --branch feat-x   # Deploy a specific branch
```

The script (`ansible/deploy.sh`) does the following in order:
1. Loads secrets from `.env` (project root), prompts for any missing ones
2. Verifies SSH connectivity to `raspberrypi53`
3. Ensures prerequisites on Pi (ansible, git, gh, docker)
4. `git pull` the target branch into `/home/scott/homemanager`
5. Fetches a fresh Teleport join token from `raspberrypi51` (node+app roles, 1h TTL)
6. Runs `ansible-playbook deploy.yml` locally on the Pi, passing all secrets as extra-vars

### Ansible Playbook

`ansible/deploy.yml` → role `homemanager` (`ansible/roles/homemanager/`):

| Task | Notes |
|------|-------|
| Template `.env.production` | Written to deploy dir, mode 0600 |
| `docker compose up -d --build` | Rebuilds images, restarts only changed containers |
| Health check | Polls `http://localhost:8080/api/health` up to 30×5s |
| `blockinfile` app_service | Adds `app_service` block to `/etc/teleport.yaml` (idempotent via markers) |
| Swap join token | Only runs when app_service block was just added (`app_block.changed`) |
| Clear `host_uuid` | Only when re-registering; forces Teleport to re-join with node+app roles |
| Restart Teleport | Handler, fires only if config changed |

**Idempotent**: Safe to run on every code push. Teleport is only restarted on the first deploy (when the app_service block is added). Subsequent runs rebuild Docker images and skip all Teleport steps.

### Container Architecture

```
Teleport (port 443)
    └── proxies → nginx (port 8080)
                      ├── /        → React SPA (static, built at image build time)
                      └── /api/    → FastAPI backend (port 8000)
```

- `Dockerfile.backend` — python:3.11-slim + uv, runs uvicorn with `--proxy-headers`
- `Dockerfile.frontend` — node:20-slim build stage → nginx:alpine serve stage
- `nginx.conf` — SPA fallback (`try_files $uri /index.html`) + `/api/` proxy
- `docker-compose.yml` — `backend` + `nginx` services, both `restart: unless-stopped`

### Teleport Re-registration

If you ever need to force Teleport to re-register (e.g., after a cluster reset):
```bash
# On raspberrypi53
sudo rm /var/lib/teleport/host_uuid
sudo systemctl restart teleport
```
Then run `deploy.sh` to inject a fresh token first.

---

## CLI Testing Tool

**`cli.py`** is a Rich-based interactive terminal tool for end-to-end API testing without needing a browser. Always use this to validate the backend.

```bash
python cli.py
```

### Menu Map

```
[1] Health Check     → GET /api/health — verify server is up
[2] Auth             → Login with email/password (Supabase) or paste JWT
[3] Homes            → List / Get / Create / Update / Delete
[4] Appliances       → List by Home / Get / Add / Update / Delete
[5] Maintenance      → List / Upcoming / Get / Create / Update / Complete / Delete
[6] Agent Chat       → CrewAI multi-agent (requires ANTHROPIC_API_KEY)
[7] Prototype Chat   → Claude Agent SDK, uses local claude CLI (no API key needed)
[0] Exit
```

Auth token is saved to **`.hmcli_config.json`** (project root). Login once, then all authenticated endpoints work.

### Standard Test Sequence

Use this order to validate the full stack end-to-end:

1. **Health** `[1]` — confirm backend is running
2. **Auth** `[2]` → Login — get a session token
3. **Create a home** `[3]` → Create — note the returned `id`
4. **List homes** `[3]` → List — confirm it appears
5. **Add an appliance** `[4]` → Add — use the home `id` from step 3
6. **List appliances** `[4]` → List by Home — confirm it appears
7. **Create a maintenance task** `[5]` → Create — link to home and appliance
8. **List tasks** `[5]` → List by Home — confirm status/priority render correctly
9. **Complete a task** `[5]` → Complete — confirm status flips to `completed`
10. **Agent chat** `[6]` → action: `chat`, any message — end-to-end AI test (slow, ~30s)
11. **Prototype chat** `[7]` → any message — tests Claude Agent SDK path

---

## API Reference

All endpoints except `/api/health` and `/api/v1/prototype/chat` require `Authorization: Bearer <supabase_jwt>`.

### Homes — `/api/v1/homes`

| Method | Path | Body / Params | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/v1/homes` | — | Returns all homes for authenticated user |
| `GET` | `/api/v1/homes/{id}` | — | 404 if not found or wrong user |
| `POST` | `/api/v1/homes` | `HomeCreate` | `name` required; `home_type` enum: `single_family \| townhouse \| condo \| multi_family \| mobile` |
| `PATCH` | `/api/v1/homes/{id}` | `HomeUpdate` | All fields optional |
| `DELETE` | `/api/v1/homes/{id}` | — | 204 on success |

### Appliances — `/api/v1/appliances`

| Method | Path | Body / Params | Notes |
|--------|------|---------------|-------|
| `POST` | `/api/v1/appliances` | `ApplianceCreate` | `home_id`, `name` required; `category` enum: `hvac \| plumbing \| electrical \| kitchen \| laundry \| outdoor \| structural \| safety \| other` |
| `GET` | `/api/v1/appliances/home/{home_id}` | — | All appliances for a home |
| `GET` | `/api/v1/appliances/{id}` | — | |
| `PATCH` | `/api/v1/appliances/{id}` | `ApplianceUpdate` | |
| `DELETE` | `/api/v1/appliances/{id}` | — | 204 |

### Maintenance — `/api/v1/maintenance/tasks`

| Method | Path | Body / Params | Notes |
|--------|------|---------------|-------|
| `POST` | `/api/v1/maintenance/tasks` | `MaintenanceTaskCreate` | `home_id`, `title` required; `frequency`: `weekly \| biweekly \| monthly \| quarterly \| biannual \| annual \| as_needed`; `priority`: `low \| medium \| high \| urgent` |
| `GET` | `/api/v1/maintenance/tasks/home/{home_id}` | `?status=` | Optional status filter |
| `GET` | `/api/v1/maintenance/tasks/upcoming` | `?days=7` | Tasks due within N days, across all homes |
| `GET` | `/api/v1/maintenance/tasks/{id}` | — | |
| `PATCH` | `/api/v1/maintenance/tasks/{id}` | `MaintenanceTaskUpdate` | Can update `status` directly: `pending \| upcoming \| overdue \| completed \| skipped` |
| `POST` | `/api/v1/maintenance/tasks/{id}/complete` | `?notes=` | Marks task completed, sets `completed_date` to today |
| `DELETE` | `/api/v1/maintenance/tasks/{id}` | — | 204 |

### Agent — `/api/v1/agent`

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `POST` | `/api/v1/agent/chat` | `{action, message, home_id?, context?}` | `action` enum: `chat \| setup_home \| update_home \| add_appliance \| identify_appliance \| generate_schedule \| adjust_schedule \| get_how_to \| get_product_recommendation \| process_document \| ask_document \| find_contractor` |
| `POST` | `/api/v1/agent/document` | multipart `file` + `?home_id=` | Uploads doc → RAG pipeline |

### Prototype — `/api/v1/prototype` (no auth)

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `POST` | `/api/v1/prototype/chat` | `{message, system_prompt?}` | Uses local `claude` CLI — requires `claude auth login` |

---

## AI System Architecture

```
User message
    │
    ▼
AgentOrchestrator (backend/agents/orchestrator.py)
    │  Routes by AgentAction enum
    ├─ HOME_ACTIONS / APPLIANCE_ACTIONS → create_home_setup_crew()
    ├─ SCHEDULE_ACTIONS               → create_schedule_crew()
    ├─ GUIDE_ACTIONS / DOCUMENT_ACTIONS → create_document_qa_crew()
    └─ CHAT                           → create_home_setup_crew() (general fallback)
         │
         ▼
    CrewAI Crew (backend/agents/crews/home_crew.py)
         │  LLM: anthropic/claude-sonnet-4-20250514
         │  Tools available to agents:
         │    - ListHomesTool, GetHomeDetailsTool, CreateHomeTool
         │    - ListAppliancesTool, AddApplianceTool
         │    - ListMaintenanceTasksTool, CreateMaintenanceTaskTool, CompleteMaintenanceTaskTool
         │    - SearchDocumentsTool (pgvector RAG)
         ▼
    Anthropic API (ANTHROPIC_API_KEY)
```

**Prototype path** (no API key):
```
POST /api/v1/prototype/chat
    │
    ▼
claude_sdk_service.run_claude_sdk_query()
    │  Spawns local `claude` subprocess
    ▼
claude CLI (uses claude.ai subscription auth)
```

---

## Database (Supabase)

Tables (PostgreSQL hosted on Supabase):

| Table | Purpose |
|-------|---------|
| `homes` | User home profiles |
| `appliances` | Appliances linked to homes |
| `maintenance_tasks` | Scheduled/completed tasks |
| `documents` | Uploaded file metadata (Supabase Storage) |
| `document_chunks` | RAG embeddings (pgvector) |

Auth: Supabase Auth (JWT). The backend verifies tokens via `supabase.auth.get_user(token)` in `backend/core/auth.py`. All DB queries are scoped to the authenticated `user_id`.

---

## Running Tests

```bash
# Pydantic model unit tests (fast, no server needed)
uv run pytest tests/ -v

# End-to-end via CLI (server must be running)
python cli.py
```

---

## Debugging & Triage

### Server won't start
- Missing deps: `uv sync`
- Port in use: check `lsof -i :8000` or change `APP_PORT` in `.env`
- Import error in a route: FastAPI prints the traceback on startup

### 401 Unauthorized from CLI
- Run option `[2] Auth` → login or paste a fresh token
- Tokens expire — re-login to refresh
- Check `.hmcli_config.json` exists and has a `token` key

### 404 from homes/appliances/tasks
- The resource belongs to a different user — each record is user-scoped
- Confirm the ID is correct: use List first, copy the exact UUID

### Agent chat returns an error message (not an exception)
- `ANTHROPIC_API_KEY` is not set or is invalid — check `.env`
- CrewAI logs go to stdout — look at the uvicorn terminal for the full traceback
- Try the Prototype endpoint `[7]` first (no API key needed) to rule out network/auth issues

### Prototype chat fails
- `claude` CLI must be installed and authenticated: run `claude auth login` in a terminal
- The `claude-agent-sdk` package must be installed: `uv sync`
- Check that `python cli.py` → `[1] Health` passes first — if the server itself is down, the SDK call will never be reached

### RAG / document upload fails
- The `document_chunks` table needs the pgvector extension enabled in Supabase
- Embedding generation falls back to a hash-based stub in dev if Supabase's embedding RPC is not set up — search results will be degraded but won't error

### Frontend can't reach backend
- CORS: `ALLOWED_ORIGINS` in `.env` is a comma-separated list of allowed origins (default `http://localhost:5173`)
- The backend must be running before the frontend makes any API calls

### Checking what the agent actually did
1. Watch the uvicorn terminal — CrewAI prints each agent step
2. Use CLI `[5] Maintenance` → List to see if tasks were created
3. Use CLI `[3] Homes` → List to see if home data was updated
4. Check Supabase Table Editor directly for raw DB state
