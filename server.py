from __future__ import annotations

import json
import secrets
import sqlite3
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "pecenje.db"
SESSIONS: dict[str, dict[str, str]] = {}


def db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with db_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                market_code TEXT UNIQUE NOT NULL,
                market_name TEXT NOT NULL,
                pin TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'market'))
            );

            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                market_code TEXT NOT NULL,
                market_name TEXT NOT NULL,
                roast_type TEXT NOT NULL CHECK(roast_type IN ('pekara', 'pilinja')),
                entry_date TEXT NOT NULL,
                item_note TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS entry_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL
            );
            """
        )

        existing = connection.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]
        if existing:
            return

        seed_users = [
            ("admin", "Administracija", "1234", "admin"),
            ("aerodrom1", "Aerodrom 1", "1111", "market"),
            ("centar", "Centar", "2222", "market"),
            ("karpos", "Karpos", "3333", "market"),
        ]
        connection.executemany(
            "INSERT INTO users (market_code, market_name, pin, role) VALUES (?, ?, ?, ?)",
            seed_users,
        )


class AppHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.handle_api_get(parsed)
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/login":
            self.handle_login()
            return
        if parsed.path == "/api/logout":
            self.handle_logout()
            return
        if parsed.path == "/api/entries":
            self.handle_create_entry()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/entries/"):
            self.handle_delete_entry(parsed.path.rsplit("/", 1)[-1])
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def handle_api_get(self, parsed) -> None:
        if parsed.path == "/api/session":
            user = self.require_auth()
            if not user:
                return
            self.send_json(user)
            return

        if parsed.path == "/api/entries":
            user = self.require_auth()
            if not user:
                return
            self.send_json({"entries": list_entries(user)})
            return

        if parsed.path == "/api/reports":
            user = self.require_auth()
            if not user:
                return
            params = parse_qs(parsed.query)
            period = params.get("period", ["daily"])[0]
            date_value = params.get("date", [datetime.now().date().isoformat()])[0]
            self.send_json(build_report(user, period, date_value))
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def handle_login(self) -> None:
        payload = self.read_json()
        market_code = str(payload.get("marketCode", "")).strip().lower()
        pin = str(payload.get("pin", "")).strip()

        with db_connection() as connection:
            user = connection.execute(
                "SELECT market_code, market_name, role FROM users WHERE market_code = ? AND pin = ?",
                (market_code, pin),
            ).fetchone()

        if not user:
            self.send_json({"error": "Pogreshen kod ili PIN."}, status=HTTPStatus.UNAUTHORIZED)
            return

        token = secrets.token_hex(24)
        user_payload = {
            "token": token,
            "marketCode": user["market_code"],
            "marketName": user["market_name"],
            "role": user["role"],
        }
        SESSIONS[token] = user_payload
        self.send_json(user_payload)

    def handle_logout(self) -> None:
        token = self.read_token()
        if token in SESSIONS:
            del SESSIONS[token]
        self.send_json({"ok": True})

    def handle_create_entry(self) -> None:
        user = self.require_auth()
        if not user:
            return

        payload = self.read_json()
        roast_type = str(payload.get("roastType", "")).strip()
        entry_date = str(payload.get("entryDate", "")).strip()
        item_note = str(payload.get("itemNote", "")).strip()
        items = payload.get("items") or []

        if roast_type not in {"pekara", "pilinja"}:
            self.send_json({"error": "Nevaliden tip na pecenje."}, status=HTTPStatus.BAD_REQUEST)
            return

        valid_items = []
        for item in items:
            name = str(item.get("name", "")).strip()
            quantity = int(item.get("quantity", 0))
            if name and quantity > 0:
                valid_items.append((name, quantity))

        if not valid_items:
            self.send_json({"error": "Potrebni se validni artikli."}, status=HTTPStatus.BAD_REQUEST)
            return

        created_at = datetime.now().isoformat()
        with db_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO entries (market_code, market_name, roast_type, entry_date, item_note, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["marketCode"],
                    user["marketName"],
                    roast_type,
                    entry_date,
                    item_note,
                    user["marketName"],
                    created_at,
                ),
            )
            entry_id = cursor.lastrowid
            connection.executemany(
                "INSERT INTO entry_items (entry_id, item_name, quantity) VALUES (?, ?, ?)",
                [(entry_id, name, quantity) for name, quantity in valid_items],
            )

        self.send_json({"ok": True, "entryId": entry_id}, status=HTTPStatus.CREATED)

    def handle_delete_entry(self, entry_id: str) -> None:
        user = self.require_auth()
        if not user:
            return

        if not entry_id.isdigit():
            self.send_json({"error": "Nevaliden ID."}, status=HTTPStatus.BAD_REQUEST)
            return

        with db_connection() as connection:
            row = connection.execute(
                "SELECT market_code FROM entries WHERE id = ?",
                (entry_id,),
            ).fetchone()

            if not row:
                self.send_json({"error": "Zapisot ne postoi."}, status=HTTPStatus.NOT_FOUND)
                return

            if user["role"] != "admin" and row["market_code"] != user["marketCode"]:
                self.send_json({"error": "Nemash dozvola za brishenje."}, status=HTTPStatus.FORBIDDEN)
                return

            connection.execute("DELETE FROM entry_items WHERE entry_id = ?", (entry_id,))
            connection.execute("DELETE FROM entries WHERE id = ?", (entry_id,))

        self.send_json({"ok": True})

    def require_auth(self):
        token = self.read_token()
        user = SESSIONS.get(token)
        if not user:
            self.send_json({"error": "Nevalidna sesija."}, status=HTTPStatus.UNAUTHORIZED)
            return None
        return user

    def read_token(self) -> str:
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:]
        return ""

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def send_json(self, payload, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


def list_entries(user: dict[str, str]) -> list[dict]:
    where_clause = ""
    params: tuple = ()
    if user["role"] != "admin":
        where_clause = "WHERE e.market_code = ?"
        params = (user["marketCode"],)

    with db_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT e.id, e.market_code, e.market_name, e.roast_type, e.entry_date, e.item_note, e.created_by
            FROM entries e
            {where_clause}
            ORDER BY e.entry_date DESC, e.id DESC
            """,
            params,
        ).fetchall()

        entries = []
        for row in rows:
            items = connection.execute(
                "SELECT item_name, quantity FROM entry_items WHERE entry_id = ? ORDER BY id ASC",
                (row["id"],),
            ).fetchall()
            entries.append(
                {
                    "id": row["id"],
                    "marketCode": row["market_code"],
                    "marketName": row["market_name"],
                    "roastType": row["roast_type"],
                    "entryDate": row["entry_date"],
                    "itemNote": row["item_note"],
                    "createdBy": row["created_by"],
                    "items": [{"name": item["item_name"], "quantity": item["quantity"]} for item in items],
                }
            )
        return entries


def build_report(user: dict[str, str], period: str, date_value: str) -> dict:
    selected = datetime.fromisoformat(date_value)
    period = "monthly" if period == "monthly" else "daily"

    if period == "daily":
        start = selected.date().isoformat()
        filter_expr = "substr(e.entry_date, 1, 10) = ?"
        label = start
    else:
        label = selected.strftime("%Y-%m")
        filter_expr = "substr(e.entry_date, 1, 7) = ?"
        start = label

    clauses = [filter_expr]
    params: list[str] = [start]
    if user["role"] != "admin":
        clauses.append("e.market_code = ?")
        params.append(user["marketCode"])

    where_sql = " AND ".join(clauses)

    with db_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT
                e.market_name,
                e.roast_type,
                COUNT(DISTINCT e.id) AS entries,
                COALESCE(SUM(i.quantity), 0) AS quantity
            FROM entries e
            JOIN entry_items i ON i.entry_id = e.id
            WHERE {where_sql}
            GROUP BY e.market_name, e.roast_type
            ORDER BY e.market_name ASC
            """,
            params,
        ).fetchall()

    totals = {"entries": 0, "quantity": 0, "pekara": 0, "pilinja": 0}
    grouped: dict[str, dict] = {}
    for row in rows:
        market_name = row["market_name"]
        grouped.setdefault(
            market_name,
            {"marketName": market_name, "entries": 0, "quantity": 0, "pekara": 0, "pilinja": 0},
        )
        grouped[market_name]["entries"] += row["entries"]
        grouped[market_name]["quantity"] += row["quantity"]
        grouped[market_name][row["roast_type"]] += row["quantity"]

        totals["entries"] += row["entries"]
        totals["quantity"] += row["quantity"]
        totals[row["roast_type"]] += row["quantity"]

    return {
        "period": period,
        "label": label,
        "totals": totals,
        "byMarket": list(grouped.values()),
    }


def run() -> None:
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", 8080), AppHandler)
    print("Server started at http://0.0.0.0:8080")
    server.serve_forever()


if __name__ == "__main__":
    run()
