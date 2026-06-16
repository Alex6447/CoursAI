from app.parsing.checklists import (
    parse_backlog,
    parse_dod,
    parse_metrics,
    parse_mvp,
)
from app.parsing.tables import parse_practice


def test_practice_rows():
    rows = parse_practice()
    assert len(rows) == 10
    assert rows[0].id == "practice:module-1"
    assert rows[0].module_ref
    assert rows[0].artifact
    assert rows[4].metric_criterion
    # модуль 8 в трекере помечен optional как статус
    by_id = {r.id: r for r in rows}
    assert by_id["practice:module-8"].default_status == "optional"


def test_backlog_items_have_week_and_phase():
    items = parse_backlog()
    assert items
    weeks = {i.week for i in items}
    assert weeks == set(range(1, 13))
    phases = {i.phase for i in items}
    assert phases == {"1–4", "5–8", "9–12"}
    first = items[0]
    assert first.id == "backlog:week-1:item-1"
    assert first.text


def test_metrics():
    metrics = parse_metrics()
    assert len(metrics) == 7
    assert metrics[0].id == "backlog:metric-1"
    assert all(m.text for m in metrics)


def test_mvp_groups():
    criteria = parse_mvp()
    groups = {c.group for c in criteria}
    assert "acceptance" in groups
    assert {"v0.1", "v0.2", "v0.3", "v0.4"} <= groups
    acceptance = [c for c in criteria if c.group == "acceptance"]
    assert len(acceptance) >= 10
    assert acceptance[0].id == "mvp:acceptance:item-1"


def test_dod():
    items = parse_dod()
    assert len(items) == 8
    assert items[0].id == "dod:item-1"
    assert all(i.text for i in items)
