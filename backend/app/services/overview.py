from __future__ import annotations

from dataclasses import dataclass

from app.services import merge
from app.store.db import Store


@dataclass
class Dimension:
    done: int
    total: int
    percent: int


@dataclass
class CurrentFocus:
    kind: str  # backlog | course | mvp | done
    id: str
    title: str
    context: str
    screen: str  # путь экрана для перехода во фронте


@dataclass
class Overview:
    theory: Dimension
    practice: Dimension
    projects: Dimension
    dod: Dimension
    current_focus: CurrentFocus | None


def _pct(done: int, total: int) -> int:
    return round(done / total * 100) if total else 0


def _dim(done: int, total: int) -> Dimension:
    return Dimension(done=done, total=total, percent=_pct(done, total))


def build(store: Store) -> Overview:
    course = merge.course_view(store)
    practice = merge.practice_view(store)
    mvp = merge.mvp_view(store)
    backlog = merge.backlog_view(store)
    dod = merge.dod_view(store)

    # Теория — модули курса (опциональные не учитываем в знаменателе).
    theory_total = sum(1 for m in course if not m.optional)
    theory_done = sum(1 for m in course if m.status == "done" and not m.optional)

    # Практика — строки трекера (опциональные не учитываем).
    practice_total = sum(1 for r in practice if r.status != "optional")
    practice_done = sum(1 for r in practice if r.status == "done")

    # Проекты — критерии приёмки RAG MVP.
    acceptance = [c for c in mvp if c.group == "acceptance"]
    projects_total = len(acceptance)
    projects_done = sum(1 for c in acceptance if c.done)

    dod_total = len(dod)
    dod_done = sum(1 for d in dod if d.done)

    # Текущий фокус по приоритету: незакрытый пункт backlog (раньше всего
    # стоит первый невыполненный пункт текущей недели) → незакрытый модуль курса
    # → незакрытый критерий приёмки MVP. Если всё закрыто — kind="done".
    focus: CurrentFocus | None = None

    next_backlog = next((b for b in backlog if not b.done), None)
    if next_backlog is not None:
        focus = CurrentFocus(
            kind="backlog",
            id=next_backlog.id,
            title=next_backlog.text,
            context=f"Неделя {next_backlog.week}",
            screen="/backlog",
        )
    else:
        next_module = next(
            (m for m in course if m.status != "done" and not m.optional), None
        )
        if next_module is not None:
            focus = CurrentFocus(
                kind="course",
                id=next_module.id,
                title=next_module.title,
                context=f"Модуль {next_module.number}",
                screen="/course",
            )
        else:
            next_criterion = next((c for c in acceptance if not c.done), None)
            if next_criterion is not None:
                focus = CurrentFocus(
                    kind="mvp",
                    id=next_criterion.id,
                    title=next_criterion.text,
                    context="Критерий приёмки MVP",
                    screen="/mvp",
                )
            else:
                focus = CurrentFocus(
                    kind="done",
                    id="",
                    title="Все критерии закрыты",
                    context="",
                    screen="",
                )

    return Overview(
        theory=_dim(theory_done, theory_total),
        practice=_dim(practice_done, practice_total),
        projects=_dim(projects_done, projects_total),
        dod=_dim(dod_done, dod_total),
        current_focus=focus,
    )
