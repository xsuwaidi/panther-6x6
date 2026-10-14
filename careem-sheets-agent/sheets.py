"""Read-only Google Sheets / Drive access, limited to Careem acquisition sheets."""

import json
import os
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]
TOKEN_FILE = Path(os.environ.get("GOOGLE_TOKEN_FILE", "token.json"))


def _credentials():
    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        return service_account.Credentials.from_service_account_info(json.loads(sa_json), scopes=SCOPES)
    sa_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE")
    if sa_file:
        return service_account.Credentials.from_service_account_file(sa_file, scopes=SCOPES)

    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        client_file = os.environ.get("GOOGLE_OAUTH_CLIENT_FILE", "credentials.json")
        if not Path(client_file).exists():
            raise SystemExit(
                f"No Google credentials found. Put your OAuth client file at {client_file!r} "
                "or set GOOGLE_SERVICE_ACCOUNT_FILE / GOOGLE_SERVICE_ACCOUNT_JSON. See README.md."
            )
        flow = InstalledAppFlow.from_client_secrets_file(client_file, SCOPES)
        creds = flow.run_local_server(port=0)
    TOKEN_FILE.write_text(creds.to_json())
    return creds


def _split_env(name: str) -> list[str]:
    return [p.strip() for p in os.environ.get(name, "").split(",") if p.strip()]


class CareemSheets:
    """Finds and reads only spreadsheets that match the configured Careem filter."""

    def __init__(self):
        creds = _credentials()
        self.drive = build("drive", "v3", credentials=creds, cache_discovery=False)
        self.sheets = build("sheets", "v4", credentials=creds, cache_discovery=False).spreadsheets()
        self.name_terms = _split_env("CAREEM_SHEET_NAME_TERMS") or ["Careem", "acquisition"]
        self.extra_ids = _split_env("CAREEM_SPREADSHEET_IDS")
        self._allowed: dict[str, dict] | None = None

    # ---- discovery -------------------------------------------------------

    def find(self, extra_term: str = "") -> list[dict]:
        terms = self.name_terms + ([extra_term] if extra_term else [])
        q = ["mimeType = 'application/vnd.google-apps.spreadsheet'", "trashed = false"]
        q += ["name contains '{}'".format(t.replace("\\", "\\\\").replace("'", "\\'")) for t in terms]
        files, token = [], None
        while True:
            resp = self.drive.files().list(
                q=" and ".join(q),
                fields="nextPageToken, files(id, name, modifiedTime, webViewLink, owners(displayName))",
                orderBy="modifiedTime desc",
                pageSize=100,
                pageToken=token,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            ).execute()
            files += resp.get("files", [])
            token = resp.get("nextPageToken")
            if not token:
                break
        for sid in self.extra_ids:
            if not any(f["id"] == sid for f in files):
                meta = self.drive.files().get(
                    fileId=sid, fields="id, name, modifiedTime, webViewLink", supportsAllDrives=True
                ).execute()
                files.append(meta)
        if not extra_term:
            self._allowed = {f["id"]: f for f in files}
        else:
            self._allowed = {**(self._allowed or {}), **{f["id"]: f for f in files}}
        return files

    def _check(self, spreadsheet_id: str):
        if self._allowed is None:
            self.find()
        if spreadsheet_id not in self._allowed:
            raise PermissionError(
                f"Spreadsheet {spreadsheet_id} is not a Careem acquisition sheet. "
                "Call find_acquisition_sheets first and use one of the returned IDs."
            )

    # ---- reading ---------------------------------------------------------

    def tabs(self, spreadsheet_id: str) -> list[dict]:
        self._check(spreadsheet_id)
        meta = self.sheets.get(
            spreadsheetId=spreadsheet_id,
            fields="properties.title, sheets.properties(title, gridProperties(rowCount, columnCount))",
        ).execute()
        return [
            {
                "tab": s["properties"]["title"],
                "rows": s["properties"]["gridProperties"].get("rowCount"),
                "columns": s["properties"]["gridProperties"].get("columnCount"),
            }
            for s in meta.get("sheets", [])
        ]

    def read(self, spreadsheet_id: str, a1_range: str) -> list[list[str]]:
        self._check(spreadsheet_id)
        resp = self.sheets.values().get(spreadsheetId=spreadsheet_id, range=a1_range).execute()
        return resp.get("values", [])
