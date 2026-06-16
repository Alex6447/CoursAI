from __future__ import annotations

import re
from dataclasses import dataclass

from app.parsing.loader import LoadedDoc, load_doc

_CHECKBOX = re.compile(r"^-\s*\[( |x|X)\]\s*(.+)$")
_BULLET = re.compile(r"^-\s+(.+)$")
_PHASE = re.compile(r"^##\s+Недели\s+(\d+\s*[–-]\s*\d+)")
_WEEK = re.compile(r"^###\s+Неделя\s+(\d+)")
_VERSION = re.compile(r"^###\s+Версия\s+(\d+\.\d+)")
_METRIC_TARGET = re.compile(r"^([\d]+(?:\s*[–-]\s*\d+)?)")


def _checkbox(line: str) -> tuple[bool, str] | None:
    match = _CHECKBOX.match(line.strip())
    if not match:
        return None
    return match.group(1).lower() == "x", match.group(2).strip()


@dataclass
class BacklogItem:
    id: str
    phase: str
    week: int
    text: str
    default_done: bool


@dataclass
class NinetyDayMetric:
    id: str
    text: str
    target: str


@dataclass
class MvpCriterion:
    id: str
    group: str
    text: str
    default_done: bool


@dataclass
class DodItem:
    id: str
    text: str
    default_done: bool


def parse_backlog(doc: LoadedDoc | None = None) -> list[BacklogItem]:
    doc = doc or load_doc("backlog")
    items: list[BacklogItem] = []
    phase = ""
    week = 0
    per_week = 0
    for line in doc.body.splitlines():
        stripped = line.strip()
        phase_match = _PHASE.match(stripped)
        if phase_match:
            phase = re.sub(r"\s+", "", phase_match.group(1))
            continue
        week_match = _WEEK.match(stripped)
        if week_match:
            week = int(week_match.group(1))
            per_week = 0
            continue
        if week == 0:
            continue
        cb = _checkbox(stripped)
        if cb is not None:
            per_week += 1
            done, text = cb
            items.append(
                BacklogItem(
                    id=f"backlog:week-{week}:item-{per_week}",
                    phase=phase,
                    week=week,
                    text=text,
                    default_done=done,
                )
            )
    return items


def parse_metrics(doc: LoadedDoc | None = None) -> list[NinetyDayMetric]:
    doc = doc or load_doc("backlog")
    metrics: list[NinetyDayMetric] = []
    in_section = False
    idx = 0
    for line in doc.body.splitlines():
        stripped = line.strip()
        if stripped.startswith("## "):
            in_section = stripped.startswith("## Метрики 90 дней")
            continue
        if not in_section:
            continue
        bullet = _BULLET.match(stripped)
        if bullet:
            idx += 1
            text = bullet.group(1).strip()
            target_match = _METRIC_TARGET.match(text)
            target = re.sub(r"\s+", "", target_match.group(1)) if target_match else ""
            metrics.append(NinetyDayMetric(id=f"backlog:metric-{idx}", text=text, target=target))
    return metrics


def parse_mvp(doc: LoadedDoc | None = None) -> list[MvpCriterion]:
    doc = doc or load_doc("mvp")
    criteria: list[MvpCriterion] = []
    group: str | None = None
    counters: dict[str, int] = {}
    for line in doc.body.splitlines():
        stripped = line.strip()
        if stripped.startswith("## Критерии приёмки MVP"):
            group = "acceptance"
            continue
        if stripped.startswith("## Backlog разработки"):
            group = None  # ждём подзаголовок версии
            continue
        if stripped.startswith("## "):
            group = None
            continue
        version_match = _VERSION.match(stripped)
        if version_match:
            group = f"v{version_match.group(1)}"
            continue
        if group is None:
            continue
        cb = _checkbox(stripped)
        if cb is not None:
            counters[group] = counters.get(group, 0) + 1
            done, text = cb
            criteria.append(
                MvpCriterion(
                    id=f"mvp:{group}:item-{counters[group]}",
                    group=group,
                    text=text,
                    default_done=done,
                )
            )
    return criteria


def parse_dod(doc: LoadedDoc | None = None) -> list[DodItem]:
    doc = doc or load_doc("dashboard")
    items: list[DodItem] = []
    in_section = False
    idx = 0
    for line in doc.body.splitlines():
        stripped = line.strip()
        if stripped.startswith("## "):
            in_section = stripped.startswith("## Definition of Done")
            continue
        if not in_section:
            continue
        cb = _checkbox(stripped)
        if cb is not None:
            idx += 1
            done, text = cb
            items.append(DodItem(id=f"dod:item-{idx}", text=text, default_done=done))
    return items
