from __future__ import annotations

import re
from dataclasses import dataclass

from app.parsing.loader import LoadedDoc, load_doc

_SEPARATOR = re.compile(r"^\|?\s*:?-{2,}.*$")
_LEADING_NUM = re.compile(r"^(\d+)")


def _split_row(line: str) -> list[str]:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def find_table(body: str, heading_prefix: str) -> tuple[list[str], list[list[str]]]:
    """Найти первую GFM-таблицу после заголовка, начинающегося на heading_prefix.

    Возвращает (заголовки, строки). Строка-разделитель `|---|` пропускается.
    """
    in_section = False
    headers: list[str] = []
    rows: list[list[str]] = []
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("## "):
            in_section = stripped.startswith(heading_prefix)
            continue
        if not in_section:
            continue
        if not stripped.startswith("|"):
            if headers:  # таблица закончилась
                break
            continue
        if _SEPARATOR.match(stripped):
            continue
        cells = _split_row(stripped)
        if not headers:
            headers = cells
        else:
            rows.append(cells)
    return headers, rows


@dataclass
class PracticeRow:
    id: str
    module_ref: str
    default_status: str
    artifact: str
    metric_criterion: str
    link: str


def parse_practice(doc: LoadedDoc | None = None) -> list[PracticeRow]:
    doc = doc or load_doc("practice")
    headers, rows = find_table(doc.body, "## Таблица прогресса")
    idx = {name: i for i, name in enumerate(headers)}

    def cell(row: list[str], name: str) -> str:
        i = idx.get(name)
        return row[i] if i is not None and i < len(row) else ""

    result: list[PracticeRow] = []
    for n, row in enumerate(rows, start=1):
        module_ref = cell(row, "Модуль")
        match = _LEADING_NUM.match(module_ref)
        number = int(match.group(1)) if match else n
        result.append(
            PracticeRow(
                id=f"practice:module-{number}",
                module_ref=module_ref,
                default_status=cell(row, "Статус"),
                artifact=cell(row, "Артефакт"),
                metric_criterion=cell(row, "Метрика/критерий"),
                link=cell(row, "Ссылка/заметка"),
            )
        )
    return result
