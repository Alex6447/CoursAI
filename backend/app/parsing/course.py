from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.parsing.loader import LoadedDoc, load_doc

_MODULE_HEADER = re.compile(r"^##\s+Модуль\s+(\d+)\s*[—–-]\s*(.+)$")
_STUDY_HEADER = re.compile(r"^\*\*Что изучить")
_TASK_HEADER = re.compile(r"^\*\*(Задание|Что сделать)")
_SUCCESS = "> [!success]"


@dataclass
class CourseModule:
    id: str
    number: int
    title: str
    niche: str
    deadline_hint: str
    study_points: list[str] = field(default_factory=list)
    task: list[str] = field(default_factory=list)
    acceptance_criterion: str = ""
    optional: bool = False


def _clean(text: str) -> str:
    return text.replace("**", "").strip()


def _parse_map(body: str) -> dict[int, dict[str, str]]:
    """Разобрать таблицу «Карта курса»: номер → title, niche, deadline_hint."""
    result: dict[int, dict[str, str]] = {}
    in_map = False
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("## "):
            in_map = stripped.startswith("## Карта курса")
            continue
        if not in_map or not stripped.startswith("|"):
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if len(cells) < 4 or not cells[0].isdigit():
            continue
        number = int(cells[0])
        result[number] = {
            "title": _clean(cells[1]),
            "niche": _clean(cells[2]),
            "deadline_hint": _clean(cells[3]),
        }
    return result


def _split_detail_sections(body: str) -> dict[int, list[str]]:
    """Разбить тело на секции «## Модуль N — ...» → строки секции."""
    sections: dict[int, list[str]] = {}
    current: int | None = None
    for line in body.splitlines():
        match = _MODULE_HEADER.match(line.strip())
        if match:
            current = int(match.group(1))
            sections[current] = []
            continue
        if current is not None:
            if line.strip().startswith("## "):  # начался другой раздел верхнего уровня
                current = None
                continue
            sections[current].append(line)
    return sections


def _collect_bullets(lines: list[str], header: re.Pattern[str]) -> list[str]:
    collecting = False
    out: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not collecting:
            if header.match(stripped):
                collecting = True
            continue
        if stripped.startswith("- "):
            out.append(stripped[2:].strip())
        elif stripped == "":
            if out:
                break
        else:
            break
    return out


def _extract_criterion(lines: list[str]) -> str:
    collecting = False
    out: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not collecting:
            if stripped.startswith(_SUCCESS):
                collecting = True
            continue
        if stripped.startswith(">"):
            content = stripped.lstrip(">").strip()
            out.append(content)
        else:
            break
    return "\n".join(out).strip()


def parse_course(doc: LoadedDoc | None = None) -> list[CourseModule]:
    doc = doc or load_doc("course")
    body = doc.body
    course_map = _parse_map(body)
    details = _split_detail_sections(body)

    modules: list[CourseModule] = []
    for number in sorted(course_map):
        meta = course_map[number]
        section = details.get(number, [])
        niche = meta["niche"]
        modules.append(
            CourseModule(
                id=f"course:module-{number}",
                number=number,
                title=meta["title"],
                niche=niche,
                deadline_hint=meta["deadline_hint"],
                study_points=_collect_bullets(section, _STUDY_HEADER),
                task=_collect_bullets(section, _TASK_HEADER),
                acceptance_criterion=_extract_criterion(section),
                optional="опц" in niche.lower(),
            )
        )
    return modules
