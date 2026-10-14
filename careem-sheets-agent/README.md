# Careem Acquisition Sheets Agent

A command-line AI agent (Claude) that reads your Careem acquisition Google Sheets and answers
questions about them in plain language, for example:

- "How many new captains did we acquire in Dubai in September vs August?"
- "Which campaign had the lowest cost per acquisition this quarter?"
- "Summarise the latest acquisition sheet by city."

The agent finds the right spreadsheet in your Drive, looks at its tabs and headers, reads or
searches the rows it needs, and tells you which sheet, tab and range each number came from.

**It can only read.** It uses read-only Google scopes, and it opens only spreadsheets whose
names match your Careem filter (by default, names containing both "Careem" and "acquisition").

## Setup (about 10 minutes)

### 1. Install

```bash
cd careem-sheets-agent
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Claude API key

Create a key at https://platform.claude.com, then put it in `.env` as `ANTHROPIC_API_KEY`.

### 3. Google access (choose one)

**Option A: your own Google account (simplest)**

1. In [Google Cloud Console](https://console.cloud.google.com/), create or pick a project.
2. Enable the **Google Sheets API** and the **Google Drive API** (APIs & Services → Library).
3. Set up the OAuth consent screen (APIs & Services → OAuth consent screen). Choose "Internal" if
   you're on a Google Workspace domain; otherwise add yourself as a test user.
4. Go to Credentials → Create credentials → OAuth client ID → **Desktop app**, download the JSON,
   and save it as `credentials.json` in this folder.
5. The first time you run the agent, a browser window asks you to approve read-only access. After
   that the login is cached in `token.json`.

**Option B: a service account (for servers or shared use)**

1. Same project and APIs as above. Create a service account and download its JSON key.
2. Set `GOOGLE_SERVICE_ACCOUNT_FILE=service-account.json` in `.env`, or put the key file's full
   JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` (useful where secrets are environment variables).
3. **Share each Careem acquisition sheet** (Viewer access) with the service account's email
   address (`...@...iam.gserviceaccount.com`).

### 4. Choose which sheets it can see

In `.env`:

```bash
CAREEM_SHEET_NAME_TERMS=Careem,acquisition     # every word must appear in the file name
CAREEM_SPREADSHEET_IDS=1AbC...                  # optional: always-allowed sheet IDs
```

A spreadsheet ID is the long string in its URL: `docs.google.com/spreadsheets/d/<ID>/edit`.

## Use

```bash
python agent.py                  # chat: ask follow-up questions in one session
python agent.py "Total new riders acquired in KSA this month?"   # single question
```

While it works, the agent prints which tools it's calling (`...list_tabs`, `...search_sheet`).

## How it works

| File | What it does |
|---|---|
| `agent.py` | The Claude agent: system prompt, four tools, and the chat loop |
| `sheets.py` | Google sign-in and read-only Drive/Sheets calls, limited to the Careem name filter |

Claude has four tools:

- `find_acquisition_sheets`: lists matching spreadsheets, newest first
- `list_tabs`: shows a spreadsheet's tabs and their sizes
- `read_range`: reads a tab or an A1 range (up to 500 rows per call)
- `search_sheet`: finds rows containing some text, together with the header row

Settings:

- **Model:** `claude-opus-5-5`
- **Effort:** set `AGENT_EFFORT` to `low`, `medium` (the default), `high`, `xhigh` or `max`
- **Refusal fallback:** turned on (`fallbacks: "default"`). If the model declines a request, the
  API retries it on Anthropic's recommended fallback model.
- **Prompt caching:** turned on, so follow-up questions don't pay full price for sheet data
  that's already in the conversation

## Security notes

- `credentials.json`, `token.json`, service-account keys and `.env` are in `.gitignore`. Never
  commit them.
- Sheet contents are sent to the Claude API to answer your questions. Check that this is allowed
  under Careem's data policies before you use it on sensitive data, such as personal data about
  captains or customers.
