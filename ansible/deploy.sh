#!/bin/bash
set -euo pipefail

# ============================================================
# HomeManager — Single-Script Deployment from Laptop
# ============================================================
# Run this from your laptop. It will:
#   1. Prompt for secrets (or read from env vars)
#   2. SSH to raspberrypi53
#   3. Git pull the latest code
#   4. Install Ansible if missing
#   5. Run the Ansible playbook locally on the Pi
#
# Usage:
#   ./deploy.sh                           # auto-loads ../.env if present, else prompts
#   ./deploy.sh --env-file path/to/.env   # load secrets from a specific file
#   ./deploy.sh --check                   # Ansible dry-run
#   ./deploy.sh --branch feature-x        # deploy a specific branch
#
# Alternatively, skip prompts by exporting env vars:
#   export SUPABASE_URL=...
#   export SUPABASE_ANON_KEY=...
#   export SUPABASE_SERVICE_ROLE_KEY=...
#   export ANTHROPIC_API_KEY=...
#   export BRAVE_SEARCH_API_KEY=...
# ============================================================

PI_HOST="raspberrypi53"
HUB_HOST="raspberrypi51"
PI_USER="scott"
REPO_URL="scottmishra/HomeManager"
DEPLOY_DIR="/home/${PI_USER}/homemanager"
BRANCH="main"
TELEPORT_CONTAINER="teleport"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
step()  { echo -e "${CYAN}[>]${NC} $*"; }
error() { echo -e "${RED}[x]${NC} $*"; }

# --- Error + exit traps: keep the window open no matter how the script ends ---
on_error() {
  echo -e "${RED}[x] Error on line $1: $2${NC}" >&2
}
on_exit() {
  local code=$?
  echo ""
  if [[ $code -eq 0 ]]; then
    echo -e "${GREEN}=== Deployment complete ===${NC}"
  else
    echo -e "${RED}=== Deployment FAILED (exit code: $code) ===${NC}"
  fi
  echo ""
  read -n 1 -s -r -p "Press any key to close..." || true
  echo ""
}
trap 'on_error $LINENO "$BASH_COMMAND"' ERR
trap on_exit EXIT

# --- Parse flags ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"   # default: project-root .env
ANSIBLE_EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)   BRANCH="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --check)    ANSIBLE_EXTRA_ARGS+=("--check"); shift ;;
    *)          ANSIBLE_EXTRA_ARGS+=("$1"); shift ;;
  esac
done

# --- Load secrets from .env file if present ---
if [[ -f "$ENV_FILE" ]]; then
  log "Loading secrets from ${ENV_FILE}"
  set -a                        # export all variables sourced below
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  warn "No .env file at ${ENV_FILE} — will prompt for secrets"
fi

# --- Collect secrets locally ---
prompt_secret() {
  local var_name="$1"
  local display_name="$2"
  local current_value="${!var_name:-}"

  if [[ -n "$current_value" ]]; then
    log "$display_name: found in environment"
  else
    echo -en "${YELLOW}[?]${NC} Enter $display_name: "
    read -r current_value
    if [[ -z "$current_value" ]]; then
      error "$display_name is required"
      exit 1
    fi
  fi

  eval "$var_name=\"$current_value\""
}

ssh_pi() {
  ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "${PI_USER}@${PI_HOST}" "$@"
}

echo ""
echo "========================================="
echo "  HomeManager Deployment"
echo "  Target: ${PI_USER}@${PI_HOST}"
echo "  Branch: ${BRANCH}"
echo "========================================="
echo ""

# --- Step 1: Collect secrets ---
step "Step 1/6: Collecting secrets..."
echo ""

prompt_secret SUPABASE_URL             "SUPABASE_URL"
prompt_secret SUPABASE_ANON_KEY        "SUPABASE_ANON_KEY"
prompt_secret SUPABASE_SERVICE_ROLE_KEY "SUPABASE_SERVICE_ROLE_KEY"
prompt_secret ANTHROPIC_API_KEY        "ANTHROPIC_API_KEY"
prompt_secret BRAVE_SEARCH_API_KEY     "BRAVE_SEARCH_API_KEY"

echo ""

# --- Step 2: Verify SSH connectivity ---
step "Step 2/6: Verifying SSH to ${PI_HOST}..."

if ! ssh_pi "echo ok" &>/dev/null; then
  error "Cannot SSH to ${PI_HOST}. Check your SSH key and network."
  exit 1
fi
log "SSH connection verified"

# --- Step 3: Ensure prerequisites on Pi ---
step "Step 3/6: Ensuring prerequisites on Pi..."

ssh_pi "bash -s" <<'PREREQS'
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# Install ansible, git, gh if missing
for pkg in ansible git; do
  if ! command -v "$pkg" &>/dev/null; then
    echo "[+] Installing $pkg..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq "$pkg" >/dev/null 2>&1
  else
    echo "[+] $pkg: already installed"
  fi
done

if ! command -v gh &>/dev/null; then
  echo "[+] Installing GitHub CLI..."
  (type -p wget >/dev/null || (sudo apt-get update -qq && sudo apt-get install -y -qq wget >/dev/null 2>&1)) \
    && sudo mkdir -p -m 755 /etc/apt/keyrings \
    && out=$(mktemp) && wget -qO "$out" https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    && cat "$out" | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null \
    && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null \
    && sudo apt-get update -qq && sudo apt-get install -y -qq gh >/dev/null 2>&1
  echo "[+] GitHub CLI installed"
else
  echo "[+] gh: already installed"
fi

# Install Docker via official script if missing (includes compose plugin)
if ! command -v docker &>/dev/null; then
  echo "[+] Installing Docker (official script)..."
  curl -fsSL https://get.docker.com | sudo sh >/dev/null 2>&1
  echo "[+] Docker installed"
else
  echo "[+] docker: already installed"
fi

# Ensure docker compose plugin is available
if ! docker compose version &>/dev/null; then
  echo "[+] Docker compose plugin missing, reinstalling Docker..."
  curl -fsSL https://get.docker.com | sudo sh >/dev/null 2>&1
fi
echo "[+] docker compose: $(docker compose version --short 2>/dev/null || echo 'installing...')"

# Ensure user is in docker group
if ! groups | grep -q docker; then
  sudo usermod -aG docker "$USER"
  echo "[!] Added $USER to docker group (may need re-login for non-ansible commands)"
else
  echo "[+] $USER already in docker group"
fi

echo "[+] Prerequisites ready"
PREREQS

# --- Step 4: Clone/pull the repo ---
step "Step 4/6: Pulling latest code (branch: ${BRANCH})..."

ssh_pi "bash -s" <<GITPULL
set -euo pipefail

if [ -d "${DEPLOY_DIR}/.git" ]; then
  cd "${DEPLOY_DIR}"
  git fetch origin
  git checkout "${BRANCH}"
  git pull origin "${BRANCH}"
  echo "[+] Repo updated to latest origin/${BRANCH}"
else
  gh repo clone "${REPO_URL}" "${DEPLOY_DIR}" -- --branch "${BRANCH}"
  echo "[+] Repo cloned to ${DEPLOY_DIR}"
fi
GITPULL

# --- Step 5: Get a fresh Teleport provision token from the hub ---
step "Step 5/6: Requesting Teleport join token from ${HUB_HOST}..."

TELEPORT_TOKEN=""
TOKEN_RAW="$(
  ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new \
    "${PI_USER}@${HUB_HOST}" \
    "sudo docker exec ${TELEPORT_CONTAINER} tctl tokens add --type=node,app --ttl=1h" 2>&1 || true
)"

# tctl output includes a line like "The invite token: <32-hex>"; extract it.
TELEPORT_TOKEN="$(echo "$TOKEN_RAW" | grep -oE '[a-f0-9]{32}' | head -n1 || true)"

if [[ -z "$TELEPORT_TOKEN" ]]; then
  warn "Could not obtain Teleport token from ${HUB_HOST}"
  warn "App service registration will be skipped this run. Hub output was:"
  echo "$TOKEN_RAW" | head -5
else
  log "Got Teleport token: ${TELEPORT_TOKEN:0:8}... (expires in 1h)"
fi

# --- Step 6: Run Ansible playbook on the Pi ---
step "Step 6/6: Running Ansible playbook on Pi..."

# Pass secrets via extra-vars to ansible-playbook over SSH.
# The playbook runs locally on the Pi (--connection=local).
ssh_pi "bash -s" <<ANSIBLE_RUN
set -euo pipefail

cd "${DEPLOY_DIR}/ansible"

sudo ansible-playbook deploy.yml \
  -i inventory/hosts.yml \
  --connection=local \
  -e "supabase_url=${SUPABASE_URL}" \
  -e "supabase_anon_key=${SUPABASE_ANON_KEY}" \
  -e "supabase_service_role_key=${SUPABASE_SERVICE_ROLE_KEY}" \
  -e "anthropic_api_key=${ANTHROPIC_API_KEY}" \
  -e "brave_search_api_key=${BRAVE_SEARCH_API_KEY}" \
  -e "teleport_token=${TELEPORT_TOKEN}" \
  ${ANSIBLE_EXTRA_ARGS[@]+"${ANSIBLE_EXTRA_ARGS[@]}"}
ANSIBLE_RUN

echo ""
log "Deployment complete!"
log "Access HomeManager at: https://homemanager.teleport.mishrahome.boo"
echo ""
