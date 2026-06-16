from __future__ import annotations

from dataclasses import dataclass

# Таблицы состояния. Ключ — стабильный id сущности (см. слой парсинга).
# Структура берётся из Markdown, здесь хранится только изменяемое состояние.
SCHEMA = """
CREATE TABLE IF NOT EXISTS module_state (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS practice_state (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    artifact_url TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    practice_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS backlog_item_state (
    id TEXT PRIMARY KEY,
    done INTEGER NOT NULL DEFAULT 0,
    done_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS metric_state (
    id TEXT PRIMARY KEY,
    current_value TEXT NOT NULL DEFAULT '',
    done INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS mvp_state (
    id TEXT PRIMARY KEY,
    done INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS dod_state (
    id TEXT PRIMARY KEY,
    done INTEGER NOT NULL DEFAULT 0
);
"""


@dataclass
class ModuleState:
    status: str
    note: str = ""


@dataclass
class PracticeState:
    status: str
    artifact_url: str = ""


@dataclass
class JournalEntry:
    id: int
    practice_id: str
    created_at: str
    data: dict


@dataclass
class BacklogItemState:
    done: bool
    done_at: str = ""


@dataclass
class MetricState:
    current_value: str = ""
    done: bool = False


@dataclass
class FlagState:
    """Состояние «галочки» для mvp_state / dod_state."""

    done: bool = False
