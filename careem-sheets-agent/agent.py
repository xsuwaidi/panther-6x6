"""Careem acquisition sheets agent.

Ask questions in plain language; Claude finds the right Careem acquisition
spreadsheet in your Google Drive, reads the relevant tabs, and answers.

    python agent.py                       # interactive chat
    python agent.py "How many new captains did we acquire in Dubai last month?"
"""

import functools
import json
import os
import sys

import anthropic
from anthropic import beta_tool
from dotenv import load_dotenv
from googleapiclient.errors import HttpError

from sheets import CareemSheets

MODEL = "claude-opus-5-5"
MAX_ROWS = 500  # rows returned per read; larger reads are truncated with a notice

SYSTEM = """You are a data assistant for Careem's acquisition team. You answer questions using \
ONLY the Careem acquisition Google Sheets you can reach through your tools - never invent numbers.

How to work:
- Start with find_acquisition_sheets to see which spreadsheets exist, then list_tabs to see their \
structure. Read a tab's header rows before reading large ranges.
- Use search_sheet to locate specific rows (a city, campaign, partner, date, etc.) instead of \
reading whole tabs when the sheet is large.
- When you compute totals, averages or growth rates, say which sheet, tab and range they came from.
- If the data is ambiguous (several sheets or tabs could match, unclear dates or column meanings), \
say what you found and what you assumed, or ask the user to clarify.
- You have read-only access. You cannot edit sheets.
- Keep answers concise; use small tables when comparing figures."""

sheets: CareemSheets | None = None


def _quote_tab(tab: str) -> str:
    return "'" + tab.replace("'", "''") + "'"


def _result(payload) -> str:
    return json.dumps(payload, ensure_ascii=False, default=str)


def _guard(fn):
    """Turn Google/permission errors into readable tool results instead of crashing."""

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except PermissionError as e:
            return _result({"error": str(e)})
        except HttpError as e:
            return _result({"error": f"Google API error {e.status_code}: {e.reason}"})

    return wrapper


@beta_tool
@_guard
def find_acquisition_sheets(name_contains: str = "") -> str:
    """List the Careem acquisition spreadsheets in Google Drive, newest first.

    Args:
        name_contains: Optional extra word the file name must contain (e.g. "2026", "UAE", "captains").
    """
    files = sheets.find(name_contains.strip())
    return _result(
        [
            {"id": f["id"], "name": f["name"], "modified": f.get("modifiedTime"), "url": f.get("webViewLink")}
            for f in files
        ]
        or {"message": "No matching spreadsheets found."}
    )


@beta_tool
@_guard
def list_tabs(spreadsheet_id: str) -> str:
    """List the tabs (worksheets) in a Careem acquisition spreadsheet with their sizes.

    Args:
        spreadsheet_id: ID returned by find_acquisition_sheets.
    """
    return _result(sheets.tabs(spreadsheet_id))


@beta_tool
@_guard
def read_range(spreadsheet_id: str, tab: str, cells: str = "") -> str:
    """Read cell values from one tab. Returns rows as lists, with the A1 range that was read.

    Args:
        spreadsheet_id: ID returned by find_acquisition_sheets.
        tab: Exact tab name from list_tabs.
        cells: Optional A1 range inside the tab, e.g. "A1:H20" or "A:D". Empty reads the whole tab.
    """
    a1 = _quote_tab(tab) + (f"!{cells}" if cells else "")
    rows = sheets.read(spreadsheet_id, a1)
    out = {"range": a1, "row_count": len(rows), "rows": rows[:MAX_ROWS]}
    if len(rows) > MAX_ROWS:
        out["truncated"] = f"Only the first {MAX_ROWS} rows are shown; read a narrower range for the rest."
    return _result(out)


@beta_tool
@_guard
def search_sheet(spreadsheet_id: str, text: str, tab: str = "") -> str:
    """Find rows containing some text (case-insensitive) and return them with their header row.

    Args:
        spreadsheet_id: ID returned by find_acquisition_sheets.
        text: Text to look for, e.g. a city, campaign name, partner or date.
        tab: Optional tab name to search; empty searches every tab.
    """
    tabs = [tab] if tab else [t["tab"] for t in sheets.tabs(spreadsheet_id)]
    needle = text.lower()
    matches = []
    for t in tabs:
        rows = sheets.read(spreadsheet_id, _quote_tab(t))
        if not rows:
            continue
        hits = [
            {"row_number": i + 1, "values": r}
            for i, r in enumerate(rows)
            if any(needle in str(c).lower() for c in r)
        ]
        if hits:
            matches.append({"tab": t, "header": rows[0], "matches": hits[:MAX_ROWS], "match_count": len(hits)})
    return _result(matches or {"message": f"No rows contain {text!r}."})


TOOLS = [find_acquisition_sheets, list_tabs, read_range, search_sheet]


def ask(client: anthropic.Anthropic, messages: list) -> str:
    """Run one user turn through the tool loop; appends the whole exchange to `messages`."""
    runner = client.beta.messages.tool_runner(
        model=MODEL,
        max_tokens=16000,
        system=SYSTEM,
        tools=TOOLS,
        messages=list(messages),  # copy: the runner keeps its own history
        output_config={"effort": os.environ.get("AGENT_EFFORT", "medium")},
        cache_control={"type": "ephemeral"},  # cache the growing conversation between turns
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",  # if the model declines, the API retries on Anthropic's recommended fallback
    )
    last = None
    for message in runner:
        last = message
        messages.append({"role": "assistant", "content": message.content})
        tool_response = runner.generate_tool_call_response()
        if tool_response is not None:
            names = [b.name for b in message.content if b.type == "tool_use"]
            print(f"  ...{', '.join(names)}", file=sys.stderr)
            messages.append(tool_response)

    if last is None:
        return "(no response)"
    if last.stop_reason == "refusal":
        return "The model declined to answer this request."
    text = "".join(b.text for b in last.content if b.type == "text").strip()
    if last.stop_reason == "max_tokens":
        text += "\n\n(answer cut off - try a narrower question)"
    return text or "(no text in response)"


def main():
    global sheets
    load_dotenv()
    sheets = CareemSheets()
    client = anthropic.Anthropic()
    messages: list = []

    if len(sys.argv) > 1:
        messages.append({"role": "user", "content": " ".join(sys.argv[1:])})
        print(ask(client, messages))
        return

    print("Careem acquisition sheets agent - ask a question (Ctrl+C or 'exit' to quit).")
    while True:
        try:
            q = input("\nyou> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if q.lower() in {"exit", "quit"}:
            break
        if not q:
            continue
        checkpoint = len(messages)
        messages.append({"role": "user", "content": q})
        try:
            print("\nagent> " + ask(client, messages))
        except anthropic.APIStatusError as e:
            del messages[checkpoint:]
            print(f"\nClaude API error {e.status_code}: {e.message}")
        except anthropic.APIConnectionError:
            del messages[checkpoint:]
            print("\nCould not reach the Claude API - check your connection and try again.")


if __name__ == "__main__":
    main()
