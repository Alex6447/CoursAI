from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from app.store.models import (
    BacklogItemState,
    FlagState,
    JournalEntry,
    MetricState,
    ModuleState,
    PracticeState,
    SCHEMA,
)


def default_db_path() -> Path:
    """Путь к БД прогресса.

    Electron передаёт каталог userData через COURSAI_DB_PATH. В dev/тестах, если
    переменной нет, используем локальный backend/.data/coursai.db.
    """
    env = os.environ.get("COURSAI_DB_PATH")
    if env:
        return Path(env)
    return Path(__file__).resolve().parents[2] / ".data" / "coursai.db"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store:
    def __init__(self, path: Path | str | None = None) -> None:
        self.path = Path(path) if path is not None else default_db_path()
        if str(self.path) != ":memory:":
            self.path.parent.mkdir(parents=True, exist_ok=True)
        # check_same_thread=False: uvicorn исполняет sync-эндпоинты в threadpool,
        # одно соединение переиспользуется между потоками (локальный однопользовательский режим).
        self.conn = sqlite3.connect(str(self.path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    # --- module_state ---
    def get_module_state(self, id: str) -> ModuleState | None:
        row = self.conn.execute(
            "SELECT status, note FROM module_state WHERE id = ?", (id,)
        ).fetchone()
        return ModuleState(row["status"], row["note"]) if row else None

    def set_module_state(self, id: str, status: str, note: str = "") -> None:
        self.conn.execute(
            "INSERT INTO module_state (id, status, note) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET status = excluded.status, note = excluded.note",
            (id, status, note),
        )
        self.conn.commit()

    def all_module_states(self) -> dict[str, ModuleState]:
        rows = self.conn.execute("SELECT id, status, note FROM module_state").fetchall()
        return {r["id"]: ModuleState(r["status"], r["note"]) for r in rows}

    # --- practice_state ---
    def get_practice_state(self, id: str) -> PracticeState | None:
        row = self.conn.execute(
            "SELECT status, artifact_url FROM practice_state WHERE id = ?", (id,)
        ).fetchone()
        return PracticeState(row["status"], row["artifact_url"]) if row else None

    def set_practice_state(self, id: str, status: str, artifact_url: str = "") -> None:
        self.conn.execute(
            "INSERT INTO practice_state (id, status, artifact_url) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET status = excluded.status, "
            "artifact_url = excluded.artifact_url",
            (id, status, artifact_url),
        )
        self.conn.commit()

    def all_practice_states(self) -> dict[str, PracticeState]:
        rows = self.conn.execute(
            "SELECT id, status, artifact_url FROM practice_state"
        ).fetchall()
        return {r["id"]: PracticeState(r["status"], r["artifact_url"]) for r in rows}

    # --- journal ---
    def add_journal_entry(self, practice_id: str, data: dict) -> JournalEntry:
        created_at = _now()
        cur = self.conn.execute(
            "INSERT INTO journal (practice_id, created_at, data) VALUES (?, ?, ?)",
            (practice_id, created_at, json.dumps(data, ensure_ascii=False)),
        )
        self.conn.commit()
        return JournalEntry(int(cur.lastrowid), practice_id, created_at, data)

    def journal_for(self, practice_id: str) -> list[JournalEntry]:
        rows = self.conn.execute(
            "SELECT id, practice_id, created_at, data FROM journal "
            "WHERE practice_id = ? ORDER BY id",
            (practice_id,),
        ).fetchall()
        return [
            JournalEntry(r["id"], r["practice_id"], r["created_at"], json.loads(r["data"]))
            for r in rows
        ]

    def all_journal(self) -> dict[str, list[JournalEntry]]:
        rows = self.conn.execute(
            "SELECT id, practice_id, created_at, data FROM journal ORDER BY id"
        ).fetchall()
        result: dict[str, list[JournalEntry]] = {}
        for r in rows:
            entry = JournalEntry(
                r["id"], r["practice_id"], r["created_at"], json.loads(r["data"])
            )
            result.setdefault(entry.practice_id, []).append(entry)
        return result

    # --- backlog_item_state ---
    def set_backlog_done(self, id: str, done: bool) -> None:
        self.conn.execute(
            "INSERT INTO backlog_item_state (id, done, done_at) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET done = excluded.done, done_at = excluded.done_at",
            (id, int(done), _now() if done else ""),
        )
        self.conn.commit()

    def all_backlog_states(self) -> dict[str, BacklogItemState]:
        rows = self.conn.execute(
            "SELECT id, done, done_at FROM backlog_item_state"
        ).fetchall()
        return {r["id"]: BacklogItemState(bool(r["done"]), r["done_at"]) for r in rows}

    # --- metric_state ---
    def set_metric_state(self, id: str, current_value: str = "", done: bool = False) -> None:
        self.conn.execute(
            "INSERT INTO metric_state (id, current_value, done) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET current_value = excluded.current_value, "
            "done = excluded.done",
            (id, current_value, int(done)),
        )
        self.conn.commit()

    def all_metric_states(self) -> dict[str, MetricState]:
        rows = self.conn.execute(
            "SELECT id, current_value, done FROM metric_state"
        ).fetchall()
        return {r["id"]: MetricState(r["current_value"], bool(r["done"])) for r in rows}

    # --- mvp_state / dod_state (флаги) ---
    def set_flag(self, table: str, id: str, done: bool) -> None:
        if table not in ("mvp_state", "dod_state"):
            raise ValueError(f"Недопустимая таблица флагов: {table}")
        self.conn.execute(
            f"INSERT INTO {table} (id, done) VALUES (?, ?) "
            "ON CONFLICT(id) DO UPDATE SET done = excluded.done",
            (id, int(done)),
        )
        self.conn.commit()

    def all_flags(self, table: str) -> dict[str, FlagState]:
        if table not in ("mvp_state", "dod_state"):
            raise ValueError(f"Недопустимая таблица флагов: {table}")
        rows = self.conn.execute(f"SELECT id, done FROM {table}").fetchall()
        return {r["id"]: FlagState(bool(r["done"])) for r in rows}
