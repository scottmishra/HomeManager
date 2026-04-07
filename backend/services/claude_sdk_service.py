"""
Prototype service: wraps claude-agent-sdk for local CLI-based inference.
Auth: uses locally installed `claude` CLI with claude.ai subscription.
ANTHROPIC_API_KEY is NOT used here.
"""
import logging
from claude_agent_sdk import query, ClaudeAgentOptions

logger = logging.getLogger(__name__)


async def run_claude_sdk_query(prompt: str, system_prompt: str | None = None) -> str:
    """Send a prompt through the Claude Agent SDK (local CLI subprocess)."""
    options = ClaudeAgentOptions(system_prompt=system_prompt)
    collected: list[str] = []

    async for message in query(prompt=prompt, options=options):
        msg_type = type(message).__name__
        logger.debug("SDK message type=%s", msg_type)

        if msg_type == "AssistantMessage":
            for block in getattr(message, "content", []):
                if hasattr(block, "text"):
                    collected.append(block.text)
        elif msg_type == "ResultMessage":
            result_text = getattr(message, "result", None)
            if result_text and not collected:
                collected.append(str(result_text))

    if not collected:
        raise RuntimeError("Claude SDK returned no assistant content.")
    return "".join(collected)
