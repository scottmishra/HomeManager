"""
Prototype service: drives the local `claude` CLI directly via subprocess.
Auth: uses locally installed `claude` CLI with claude.ai subscription.
ANTHROPIC_API_KEY is NOT used here.

Runs synchronously in a thread pool to avoid Windows asyncio subprocess limitations.
"""
import asyncio
import json
import logging
import os
import shutil
import subprocess
import sys

logger = logging.getLogger(__name__)

_CLAUDE_PATH: str | None = None


def _find_claude() -> str:
    global _CLAUDE_PATH
    if _CLAUDE_PATH:
        return _CLAUDE_PATH
    path = shutil.which("claude")
    if not path:
        raise RuntimeError(
            "claude CLI not found in PATH. Run `claude auth login` to install and authenticate."
        )
    _CLAUDE_PATH = path
    return path


def _run_claude_sync(prompt: str, system_prompt: str | None) -> str:
    """Invoke the claude CLI synchronously and return the assistant's text."""
    cli = _find_claude()
    cmd = [cli, "--output-format", "stream-json", "--verbose", "--input-format", "stream-json"]

    stdin_msg = json.dumps({
        "type": "user",
        "message": {"role": "user", "content": prompt},
    }) + "\n"

    if system_prompt:
        cmd += ["--system-prompt", system_prompt]

    # Strip ANTHROPIC_API_KEY so the CLI uses subscription auth, not API key auth.
    env = os.environ.copy()
    env.pop("ANTHROPIC_API_KEY", None)

    logger.debug("Spawning claude CLI: %s", cmd)

    try:
        result = subprocess.run(
            cmd,
            input=stdin_msg,
            capture_output=True,
            text=True,
            timeout=120,
            encoding="utf-8",
            env=env,
        )
    except FileNotFoundError:
        raise RuntimeError(f"claude CLI not found at {cli!r}")
    except subprocess.TimeoutExpired:
        raise RuntimeError("claude CLI timed out after 120 seconds")

    if result.returncode != 0:
        stderr = result.stderr.strip() or "(no stderr)"
        # Log full stdout to server logs for debugging
        logger.error("claude stdout (full):\n%s", result.stdout)
        # Show last 1000 chars in the exception (most relevant part)
        stdout_tail = result.stdout.strip()[-1000:] or "(no stdout)"
        raise RuntimeError(
            f"claude CLI exited with code {result.returncode}.\n"
            f"stderr: {stderr}\n"
            f"stdout tail: {stdout_tail}"
        )

    # Parse the stream-json output — collect assistant text blocks
    collected: list[str] = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            logger.debug("Non-JSON line from claude: %s", line)
            continue

        msg_type = msg.get("type")
        if msg_type == "assistant":
            for block in msg.get("message", {}).get("content", []):
                if block.get("type") == "text":
                    collected.append(block["text"])
        elif msg_type == "result" and not collected:
            result_text = msg.get("result", "")
            if result_text:
                collected.append(result_text)

    if not collected:
        logger.error("claude stdout: %s", result.stdout[:2000])
        raise RuntimeError("claude CLI returned no assistant content.")

    return "".join(collected)


async def run_claude_sdk_query(prompt: str, system_prompt: str | None = None) -> str:
    """Run the claude CLI in a thread pool and return the response text."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_claude_sync, prompt, system_prompt)
