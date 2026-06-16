from __future__ import annotations

from dataclasses import dataclass, field

from app.parsing.checklists import parse_backlog, parse_dod, parse_metrics, parse_mvp
from app.parsing.course import parse_course
from app.parsing.tables import parse_practice
from app.store.db import Store


@dataclass
class CourseModuleView:
    id: str
    number: int
    title: str
    niche: str
    deadline_hint: str
    study_points: list[str]
    task: list[str]
    acceptance_criterion: str
    optional: bool
    status: str
    note: str


@dataclass
class JournalEntryView:
    id: int
    created_at: str
    data: dict


@dataclass
class PracticeRowView:
    id: str
    module_ref: str
    artifact: str
    metric_criterion: str
    link: str
    status: str
    artifact_url: str
    journal: list[JournalEntryView] = field(default_factory=list)


@dataclass
class BacklogItemView:
    id: str
    phase: str
    week: int
    text: str
    done: bool
    done_at: str


@dataclass
class MetricView:
    id: str
    text: str
    target: str
    current_value: str
    done: bool


@dataclass
class MvpCriterionView:
    id: str
    group: str
    text: str
    done: bool


@dataclass
class DodItemView:
    id: str
    text: str
    done: bool


def course_view(store: Store) -> list[CourseModuleView]:
    states = store.all_module_states()
    out: list[CourseModuleView] = []
    for m in parse_course():
        state = states.get(m.id)
        default_status = "optional" if m.optional else "not_started"
        out.append(
            CourseModuleView(
                id=m.id,
                number=m.number,
                title=m.title,
                niche=m.niche,
                deadline_hint=m.deadline_hint,
                study_points=m.study_points,
                task=m.task,
                acceptance_criterion=m.acceptance_criterion,
                optional=m.optional,
                status=state.status if state else default_status,
                note=state.note if state else "",
            )
        )
    return out


def practice_view(store: Store) -> list[PracticeRowView]:
    states = store.all_practice_states()
    journal = store.all_journal()
    out: list[PracticeRowView] = []
    for r in parse_practice():
        state = states.get(r.id)
        entries = [
            JournalEntryView(e.id, e.created_at, e.data) for e in journal.get(r.id, [])
        ]
        out.append(
            PracticeRowView(
                id=r.id,
                module_ref=r.module_ref,
                artifact=r.artifact,
                metric_criterion=r.metric_criterion,
                link=r.link,
                status=state.status if state else r.default_status,
                artifact_url=state.artifact_url if state else "",
                journal=entries,
            )
        )
    return out


def backlog_view(store: Store) -> list[BacklogItemView]:
    states = store.all_backlog_states()
    out: list[BacklogItemView] = []
    for item in parse_backlog():
        state = states.get(item.id)
        out.append(
            BacklogItemView(
                id=item.id,
                phase=item.phase,
                week=item.week,
                text=item.text,
                done=state.done if state else item.default_done,
                done_at=state.done_at if state else "",
            )
        )
    return out


def metrics_view(store: Store) -> list[MetricView]:
    states = store.all_metric_states()
    out: list[MetricView] = []
    for m in parse_metrics():
        state = states.get(m.id)
        out.append(
            MetricView(
                id=m.id,
                text=m.text,
                target=m.target,
                current_value=state.current_value if state else "",
                done=state.done if state else False,
            )
        )
    return out


def mvp_view(store: Store) -> list[MvpCriterionView]:
    states = store.all_flags("mvp_state")
    out: list[MvpCriterionView] = []
    for c in parse_mvp():
        state = states.get(c.id)
        out.append(
            MvpCriterionView(
                id=c.id,
                group=c.group,
                text=c.text,
                done=state.done if state else c.default_done,
            )
        )
    return out


def dod_view(store: Store) -> list[DodItemView]:
    states = store.all_flags("dod_state")
    out: list[DodItemView] = []
    for d in parse_dod():
        state = states.get(d.id)
        out.append(
            DodItemView(
                id=d.id,
                text=d.text,
                done=state.done if state else d.default_done,
            )
        )
    return out
