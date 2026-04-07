#!/usr/bin/env python3
"""HomeManager CLI — Interactive terminal tool for testing the API."""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from rich import box
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
from rich.table import Table

load_dotenv()

BASE_URL = os.getenv("API_URL", "http://localhost:8000")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
CONFIG_PATH = Path(".hmcli_config.json")
console = Console()


# ── Config ────────────────────────────────────────────────────────────────────

def load_config() -> dict:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text())
    return {}

def save_config(data: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(data, indent=2))

def get_token() -> str | None:
    return load_config().get("token")


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def _headers(token: str | None = None) -> dict:
    h: dict = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h

def _raise(r: httpx.Response) -> None:
    """Raise with the response body as the error message."""
    try:
        detail = r.json().get("detail", r.text)
    except Exception:
        detail = r.text
    raise httpx.HTTPStatusError(f"HTTP {r.status_code}: {detail}", request=r.request, response=r)

def api_get(path: str, token: str | None = None, params: dict | None = None) -> Any:
    r = httpx.get(f"{BASE_URL}{path}", headers=_headers(token), params=params, timeout=30)
    if not r.is_success:
        _raise(r)
    return r.json() if r.content else None

def api_post(
    path: str,
    body: dict | None = None,
    token: str | None = None,
    params: dict | None = None,
) -> Any:
    r = httpx.post(
        f"{BASE_URL}{path}", json=body, headers=_headers(token), params=params, timeout=90
    )
    if not r.is_success:
        _raise(r)
    return r.json() if r.content else None

def api_patch(path: str, body: dict, token: str) -> Any:
    r = httpx.patch(f"{BASE_URL}{path}", json=body, headers=_headers(token), timeout=30)
    if not r.is_success:
        _raise(r)
    return r.json()

def api_delete(path: str, token: str) -> None:
    r = httpx.delete(f"{BASE_URL}{path}", headers=_headers(token), timeout=30)
    if not r.is_success:
        _raise(r)


# ── Output helpers ────────────────────────────────────────────────────────────

def err(msg: str) -> None:
    console.print(f"[red]✗ {msg}[/red]")

def ok(msg: str) -> None:
    console.print(f"[green]✓ {msg}[/green]")

def info(msg: str) -> None:
    console.print(f"[dim]{msg}[/dim]")

def require_auth() -> str | None:
    token = get_token()
    if not token:
        err("Not logged in. Choose [bold]Auth[/bold] from the main menu first.")
    return token

def ask(field: str, hint: str = "") -> str | None:
    """Prompt for an optional field; return None if blank."""
    suffix = f" [dim]{hint}[/dim]" if hint else ""
    val = Prompt.ask(f"  {field}{suffix}", default="")
    return val.strip() or None


# ── Tables & panels ───────────────────────────────────────────────────────────

def homes_table(homes: list) -> Table:
    t = Table(box=box.ROUNDED, header_style="bold cyan", show_lines=False)
    t.add_column("ID", style="dim", width=36)
    t.add_column("Name", style="bold")
    t.add_column("Type")
    t.add_column("City")
    t.add_column("St")
    t.add_column("Sqft", justify="right")
    t.add_column("Yr Built", justify="right")
    for h in homes:
        t.add_row(
            h.get("id", ""),
            h.get("name", ""),
            h.get("home_type", ""),
            h.get("city") or "",
            h.get("state") or "",
            str(h.get("square_footage") or ""),
            str(h.get("year_built") or ""),
        )
    return t

def home_panel(h: dict) -> Panel:
    body = "\n".join([
        f"[bold]Name:[/bold]       {h.get('name')}",
        f"[bold]Type:[/bold]       {h.get('home_type')}",
        f"[bold]Address:[/bold]    {h.get('address') or ''}, {h.get('city') or ''} {h.get('state') or ''} {h.get('zip_code') or ''}",
        f"[bold]Year Built:[/bold] {h.get('year_built') or '—'}",
        f"[bold]Sq Ft:[/bold]      {h.get('square_footage') or '—'}",
        f"[bold]Bed/Bath:[/bold]   {h.get('num_bedrooms') or '—'} / {h.get('num_bathrooms') or '—'}",
        f"[bold]Notes:[/bold]      {h.get('notes') or ''}",
        f"\n[dim]ID: {h.get('id')}[/dim]",
    ])
    return Panel(body, title="[bold cyan]Home[/bold cyan]", box=box.ROUNDED)

def appliances_table(appliances: list) -> Table:
    t = Table(box=box.ROUNDED, header_style="bold cyan")
    t.add_column("ID", style="dim", width=36)
    t.add_column("Name", style="bold")
    t.add_column("Category")
    t.add_column("Brand")
    t.add_column("Location")
    t.add_column("Warranty Expiry")
    for a in appliances:
        t.add_row(
            a.get("id", ""),
            a.get("name", ""),
            a.get("category", ""),
            a.get("brand") or "",
            a.get("location_in_home") or "",
            str(a.get("warranty_expiry") or ""),
        )
    return t

def appliance_panel(a: dict) -> Panel:
    body = "\n".join([
        f"[bold]Name:[/bold]            {a.get('name')}",
        f"[bold]Category:[/bold]        {a.get('category')}",
        f"[bold]Brand:[/bold]           {a.get('brand') or '—'}",
        f"[bold]Model:[/bold]           {a.get('model_number') or '—'}",
        f"[bold]Serial:[/bold]          {a.get('serial_number') or '—'}",
        f"[bold]Location:[/bold]        {a.get('location_in_home') or '—'}",
        f"[bold]Purchased:[/bold]       {a.get('purchase_date') or '—'}",
        f"[bold]Installed:[/bold]       {a.get('install_date') or '—'}",
        f"[bold]Warranty Expiry:[/bold] {a.get('warranty_expiry') or '—'}",
        f"[bold]Notes:[/bold]           {a.get('notes') or ''}",
        f"\n[dim]ID: {a.get('id')}  Home: {a.get('home_id')}[/dim]",
    ])
    return Panel(body, title="[bold cyan]Appliance[/bold cyan]", box=box.ROUNDED)

_STATUS_COLOR = {
    "pending": "yellow", "upcoming": "blue", "overdue": "red bold",
    "completed": "green", "skipped": "dim",
}
_PRIORITY_COLOR = {
    "low": "dim", "medium": "yellow", "high": "orange1", "urgent": "red bold",
}

def tasks_table(tasks: list) -> Table:
    t = Table(box=box.ROUNDED, header_style="bold cyan")
    t.add_column("ID", style="dim", width=36)
    t.add_column("Title", style="bold")
    t.add_column("Status")
    t.add_column("Priority")
    t.add_column("Due Date")
    t.add_column("Frequency")
    for task in tasks:
        status = task.get("status", "pending")
        priority = task.get("priority", "medium")
        t.add_row(
            task.get("id", ""),
            task.get("title", ""),
            f"[{_STATUS_COLOR.get(status, '')}]{status}[/]",
            f"[{_PRIORITY_COLOR.get(priority, '')}]{priority}[/]",
            str(task.get("due_date") or ""),
            task.get("frequency", ""),
        )
    return t

def task_panel(task: dict) -> Panel:
    status = task.get("status", "pending")
    priority = task.get("priority", "medium")
    body = "\n".join([
        f"[bold]Title:[/bold]       {task.get('title')}",
        f"[bold]Status:[/bold]      [{_STATUS_COLOR.get(status, '')}]{status}[/]",
        f"[bold]Priority:[/bold]    [{_PRIORITY_COLOR.get(priority, '')}]{priority}[/]",
        f"[bold]Frequency:[/bold]   {task.get('frequency')}",
        f"[bold]Due Date:[/bold]    {task.get('due_date') or '—'}",
        f"[bold]Completed:[/bold]   {task.get('completed_date') or 'No'}",
        f"[bold]Duration:[/bold]    {task.get('estimated_duration_minutes') or '—'} min",
        f"[bold]Est. Cost:[/bold]   ${task.get('estimated_cost') or '—'}",
        f"[bold]Description:[/bold] {task.get('description') or ''}",
        f"\n[dim]ID: {task.get('id')}  Home: {task.get('home_id')}[/dim]",
    ])
    return Panel(body, title="[bold cyan]Maintenance Task[/bold cyan]", box=box.ROUNDED)


# ── Auth ──────────────────────────────────────────────────────────────────────

def auth_menu() -> None:
    console.rule("[bold]Auth[/bold]")
    cfg = load_config()
    token = cfg.get("token")
    if token:
        console.print(f"[green]Logged in.[/green] Token: [dim]{token[:48]}...[/dim]\n")
    else:
        console.print("[red]Not logged in.[/red]\n")

    choice = Prompt.ask(
        "  [1] Login (email/password)  [2] Paste JWT token  [3] Logout  [0] Back",
        choices=["0", "1", "2", "3"],
    )

    if choice == "1":
        if not SUPABASE_URL:
            err("SUPABASE_URL not set in .env")
            return
        email = Prompt.ask("  Email")
        password = Prompt.ask("  Password", password=True)
        try:
            r = httpx.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                json={"email": email, "password": password},
                headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
                timeout=15,
            )
            r.raise_for_status()
            token = r.json().get("access_token")
            if token:
                cfg["token"] = token
                save_config(cfg)
                ok(f"Logged in as {email}")
            else:
                err(f"No access_token in response: {r.json()}")
        except Exception as e:
            err(f"Login failed: {e}")

    elif choice == "2":
        token = Prompt.ask("  Paste JWT token").strip()
        cfg["token"] = token
        save_config(cfg)
        ok("Token saved.")

    elif choice == "3":
        cfg.pop("token", None)
        save_config(cfg)
        ok("Logged out.")


# ── Homes ─────────────────────────────────────────────────────────────────────

def homes_menu(token: str) -> None:
    while True:
        console.rule("[bold]Homes[/bold]")
        choice = Prompt.ask(
            "  [1] List  [2] Get  [3] Create  [4] Update  [5] Delete  [0] Back",
            choices=["0", "1", "2", "3", "4", "5"],
        )
        console.print()
        if choice == "0":
            break

        elif choice == "1":
            try:
                homes = api_get("/api/v1/homes", token)
                console.print(homes_table(homes) if homes else "[dim]No homes found.[/dim]")
            except Exception as e:
                err(str(e))

        elif choice == "2":
            home_id = Prompt.ask("  Home ID")
            try:
                console.print(home_panel(api_get(f"/api/v1/homes/{home_id}", token)))
            except Exception as e:
                err(str(e))

        elif choice == "3":
            name = Prompt.ask("  Name")
            home_type = Prompt.ask(
                "  Type",
                choices=["single_family", "townhouse", "condo", "multi_family", "mobile"],
                default="single_family",
            )
            body: dict = {"name": name, "home_type": home_type}
            for field, hint, cast in [
                ("address",        "",                str),
                ("city",           "",                str),
                ("state",          "2-letter",        str),
                ("zip_code",       "",                str),
                ("year_built",     "e.g. 1998",       int),
                ("square_footage", "sq ft",           int),
                ("num_bedrooms",   "",                int),
                ("num_bathrooms",  "e.g. 2.5",        float),
                ("notes",          "",                str),
            ]:
                val = ask(field.replace("_", " ").title(), hint)
                if val:
                    body[field] = cast(val)
            try:
                h = api_post("/api/v1/homes", body, token)
                ok(f"Created: {h['id']}")
                console.print(home_panel(h))
            except Exception as e:
                err(str(e))

        elif choice == "4":
            home_id = Prompt.ask("  Home ID to update")
            info("Leave any field blank to skip it.")
            body = {}
            for field, hint in [
                ("name", ""), ("address", ""), ("city", ""), ("state", "2-letter"),
                ("zip_code", ""), ("notes", ""),
            ]:
                val = ask(field.replace("_", " ").title(), hint)
                if val:
                    body[field] = val
            if not body:
                info("Nothing to update.")
                continue
            try:
                console.print(home_panel(api_patch(f"/api/v1/homes/{home_id}", body, token)))
                ok("Updated.")
            except Exception as e:
                err(str(e))

        elif choice == "5":
            home_id = Prompt.ask("  Home ID to delete")
            if Confirm.ask(f"  [red]Delete home {home_id}?[/red]"):
                try:
                    api_delete(f"/api/v1/homes/{home_id}", token)
                    ok("Deleted.")
                except Exception as e:
                    err(str(e))


# ── Appliances ────────────────────────────────────────────────────────────────

_APPLIANCE_CATEGORIES = [
    "hvac", "plumbing", "electrical", "kitchen",
    "laundry", "outdoor", "structural", "safety", "other",
]

def appliances_menu(token: str) -> None:
    while True:
        console.rule("[bold]Appliances[/bold]")
        choice = Prompt.ask(
            "  [1] List by Home  [2] Get  [3] Add  [4] Update  [5] Delete  [0] Back",
            choices=["0", "1", "2", "3", "4", "5"],
        )
        console.print()
        if choice == "0":
            break

        elif choice == "1":
            home_id = Prompt.ask("  Home ID")
            try:
                result = api_get(f"/api/v1/appliances/home/{home_id}", token)
                console.print(appliances_table(result) if result else "[dim]No appliances found.[/dim]")
            except Exception as e:
                err(str(e))

        elif choice == "2":
            appliance_id = Prompt.ask("  Appliance ID")
            try:
                console.print(appliance_panel(api_get(f"/api/v1/appliances/{appliance_id}", token)))
            except Exception as e:
                err(str(e))

        elif choice == "3":
            home_id = Prompt.ask("  Home ID")
            name = Prompt.ask("  Name")
            category = Prompt.ask("  Category", choices=_APPLIANCE_CATEGORIES, default="other")
            body: dict = {"home_id": home_id, "name": name, "category": category}
            for field, hint in [
                ("brand", ""), ("model_number", ""), ("serial_number", ""),
                ("location_in_home", "e.g. Basement"),
                ("purchase_date", "YYYY-MM-DD"), ("install_date", "YYYY-MM-DD"),
                ("warranty_expiry", "YYYY-MM-DD"), ("notes", ""),
            ]:
                val = ask(field.replace("_", " ").title(), hint)
                if val:
                    body[field] = val
            try:
                a = api_post("/api/v1/appliances", body, token)
                ok(f"Added: {a['id']}")
                console.print(appliance_panel(a))
            except Exception as e:
                err(str(e))

        elif choice == "4":
            appliance_id = Prompt.ask("  Appliance ID to update")
            info("Leave any field blank to skip it.")
            body = {}
            for field, hint in [
                ("name", ""), ("brand", ""), ("model_number", ""),
                ("warranty_expiry", "YYYY-MM-DD"), ("notes", ""),
            ]:
                val = ask(field.replace("_", " ").title(), hint)
                if val:
                    body[field] = val
            if not body:
                info("Nothing to update.")
                continue
            try:
                ok("Updated.")
                console.print(appliance_panel(api_patch(f"/api/v1/appliances/{appliance_id}", body, token)))
            except Exception as e:
                err(str(e))

        elif choice == "5":
            appliance_id = Prompt.ask("  Appliance ID to delete")
            if Confirm.ask(f"  [red]Delete appliance {appliance_id}?[/red]"):
                try:
                    api_delete(f"/api/v1/appliances/{appliance_id}", token)
                    ok("Deleted.")
                except Exception as e:
                    err(str(e))


# ── Maintenance ───────────────────────────────────────────────────────────────

_FREQUENCIES = ["weekly", "biweekly", "monthly", "quarterly", "biannual", "annual", "as_needed"]
_PRIORITIES  = ["low", "medium", "high", "urgent"]
_STATUSES    = ["pending", "upcoming", "overdue", "completed", "skipped"]

def maintenance_menu(token: str) -> None:
    while True:
        console.rule("[bold]Maintenance Tasks[/bold]")
        choice = Prompt.ask(
            "  [1] List by Home  [2] Upcoming  [3] Get  [4] Create  [5] Update  [6] Complete  [7] Delete  [0] Back",
            choices=["0", "1", "2", "3", "4", "5", "6", "7"],
        )
        console.print()
        if choice == "0":
            break

        elif choice == "1":
            home_id = Prompt.ask("  Home ID")
            status_filter = ask("Filter by status", "blank = all  |  " + " / ".join(_STATUSES))
            params = {"status": status_filter} if status_filter else {}
            try:
                tasks = api_get(f"/api/v1/maintenance/tasks/home/{home_id}", token, params)
                console.print(tasks_table(tasks) if tasks else "[dim]No tasks found.[/dim]")
            except Exception as e:
                err(str(e))

        elif choice == "2":
            days = Prompt.ask("  Look-ahead days", default="7")
            try:
                tasks = api_get("/api/v1/maintenance/tasks/upcoming", token, {"days": days})
                console.print(tasks_table(tasks) if tasks else "[dim]No upcoming tasks.[/dim]")
            except Exception as e:
                err(str(e))

        elif choice == "3":
            task_id = Prompt.ask("  Task ID")
            try:
                console.print(task_panel(api_get(f"/api/v1/maintenance/tasks/{task_id}", token)))
            except Exception as e:
                err(str(e))

        elif choice == "4":
            home_id  = Prompt.ask("  Home ID")
            title    = Prompt.ask("  Title")
            priority = Prompt.ask("  Priority", choices=_PRIORITIES, default="medium")
            frequency = Prompt.ask("  Frequency", choices=_FREQUENCIES, default="annual")
            body: dict = {
                "home_id": home_id, "title": title,
                "priority": priority, "frequency": frequency,
            }
            for field, hint, cast in [
                ("due_date",                    "YYYY-MM-DD",  str),
                ("description",                 "",            str),
                ("estimated_duration_minutes",  "minutes",     int),
                ("estimated_cost",              "dollars",     float),
                ("appliance_id",                "optional",    str),
            ]:
                val = ask(field.replace("_", " ").title(), hint)
                if val:
                    body[field] = cast(val)
            try:
                task = api_post("/api/v1/maintenance/tasks", body, token)
                ok(f"Created: {task['id']}")
                console.print(task_panel(task))
            except Exception as e:
                err(str(e))

        elif choice == "5":
            task_id = Prompt.ask("  Task ID to update")
            info("Leave any field blank to skip it.")
            body = {}
            title = ask("Title")
            if title:
                body["title"] = title
            status = ask("Status", " / ".join(_STATUSES))
            if status:
                body["status"] = status
            priority = ask("Priority", " / ".join(_PRIORITIES))
            if priority:
                body["priority"] = priority
            due_date = ask("Due Date", "YYYY-MM-DD")
            if due_date:
                body["due_date"] = due_date
            description = ask("Description")
            if description:
                body["description"] = description
            if not body:
                info("Nothing to update.")
                continue
            try:
                ok("Updated.")
                console.print(task_panel(api_patch(f"/api/v1/maintenance/tasks/{task_id}", body, token)))
            except Exception as e:
                err(str(e))

        elif choice == "6":
            task_id = Prompt.ask("  Task ID to complete")
            notes = ask("Completion notes", "optional")
            params = {"notes": notes} if notes else {}
            try:
                task = api_post(
                    f"/api/v1/maintenance/tasks/{task_id}/complete",
                    token=token,
                    params=params,
                )
                ok("Task marked complete!")
                console.print(task_panel(task))
            except Exception as e:
                err(str(e))

        elif choice == "7":
            task_id = Prompt.ask("  Task ID to delete")
            if Confirm.ask(f"  [red]Delete task {task_id}?[/red]"):
                try:
                    api_delete(f"/api/v1/maintenance/tasks/{task_id}", token)
                    ok("Deleted.")
                except Exception as e:
                    err(str(e))


# ── Agent Chat ────────────────────────────────────────────────────────────────

_AGENT_ACTIONS = [
    "chat", "setup_home", "update_home", "add_appliance", "identify_appliance",
    "generate_schedule", "adjust_schedule", "get_how_to", "get_product_recommendation",
    "process_document", "ask_document", "find_contractor",
]

def agent_menu(token: str) -> None:
    console.rule("[bold]Agent Chat (CrewAI)[/bold]")
    console.print(
        "[dim]Available actions:[/dim] " + "  ".join(f"[cyan]{a}[/cyan]" for a in _AGENT_ACTIONS)
    )
    console.print()
    while True:
        action  = Prompt.ask("  Action", choices=_AGENT_ACTIONS, default="chat")
        message = Prompt.ask("  Message")
        home_id = ask("Home ID", "optional")

        body: dict = {"action": action, "message": message}
        if home_id:
            body["home_id"] = home_id

        try:
            with console.status("[bold green]Agent thinking...[/bold green]"):
                resp = api_post("/api/v1/agent/chat", body, token)
            console.print()
            console.print(Panel(
                Markdown(resp.get("message", "")),
                title=f"[bold green]Agent[/bold green] [dim]({resp.get('action')})[/dim]",
                box=box.ROUNDED,
            ))
            if resp.get("suggested_actions"):
                console.print(
                    "[dim]Suggested:[/dim] " +
                    "  ".join(f"[cyan]{a}[/cyan]" for a in resp["suggested_actions"])
                )
        except Exception as e:
            err(str(e))

        console.print()
        if not Confirm.ask("  Send another?", default=True):
            break


# ── Prototype Chat ────────────────────────────────────────────────────────────

def prototype_menu() -> None:
    console.rule("[bold]Prototype Chat (Claude Agent SDK)[/bold]")
    info("Uses your local claude CLI / claude.ai subscription — no API key needed.\n")
    while True:
        message       = Prompt.ask("  Message")
        system_prompt = ask("System prompt", "blank = default home maintenance assistant")

        body: dict = {"message": message}
        if system_prompt:
            body["system_prompt"] = system_prompt

        try:
            with console.status("[bold blue]Claude Agent SDK running...[/bold blue]"):
                resp = api_post("/api/v1/prototype/chat", body)
            console.print()
            console.print(Panel(
                Markdown(resp.get("message", "")),
                title="[bold blue]Claude SDK[/bold blue]",
                box=box.ROUNDED,
            ))
        except Exception as e:
            err(str(e))

        console.print()
        if not Confirm.ask("  Send another?", default=True):
            break


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    console.print(Panel(
        "[bold cyan]HomeManager CLI[/bold cyan]\n[dim]Interactive API testing tool[/dim]",
        box=box.DOUBLE_EDGE,
        padding=(0, 4),
    ))

    while True:
        token = get_token()
        auth_status = "[green]● logged in[/green]" if token else "[red]● not logged in[/red]"
        console.print(f"\n  {auth_status}  [dim]server: {BASE_URL}[/dim]\n")

        choice = Prompt.ask(
            "  [1] Health  [2] Auth  [3] Homes  [4] Appliances  [5] Maintenance"
            "  [6] Agent Chat  [7] Prototype  [0] Exit",
            choices=["0", "1", "2", "3", "4", "5", "6", "7"],
        )
        console.print()

        if choice == "0":
            info("Bye!")
            break

        elif choice == "1":
            try:
                data = api_get("/api/health")
                ok(f"Server healthy — v{data.get('version')}")
            except Exception as e:
                err(f"Server unreachable: {e}")

        elif choice == "2":
            auth_menu()

        elif choice == "3":
            if t := require_auth():
                homes_menu(t)

        elif choice == "4":
            if t := require_auth():
                appliances_menu(t)

        elif choice == "5":
            if t := require_auth():
                maintenance_menu(t)

        elif choice == "6":
            if t := require_auth():
                agent_menu(t)

        elif choice == "7":
            prototype_menu()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="HomeManager CLI")
    parser.add_argument(
        "--prototype-chat",
        metavar="MESSAGE",
        help="Send a single message to the prototype chat endpoint and exit (non-interactive)",
    )
    parser.add_argument(
        "--system-prompt",
        metavar="PROMPT",
        default=None,
        help="Optional system prompt for --prototype-chat",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()

    if args.prototype_chat:
        body: dict = {"message": args.prototype_chat}
        if args.system_prompt:
            body["system_prompt"] = args.system_prompt
        try:
            resp = api_post("/api/v1/prototype/chat", body)
            sys.stdout.buffer.write((resp.get("message", "") + "\n").encode("utf-8"))
            sys.stdout.buffer.flush()
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        main()
