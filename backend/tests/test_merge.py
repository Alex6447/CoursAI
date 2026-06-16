from app.services.merge import (
    backlog_view,
    course_view,
    dod_view,
    mvp_view,
    practice_view,
)
from app.store.db import Store


def test_course_default_status(tmp_path):
    store = Store(tmp_path / "t.db")
    modules = {m.id: m for m in course_view(store)}
    assert modules["course:module-1"].status == "not_started"
    assert modules["course:module-8"].status == "optional"
    store.close()


def test_course_status_overlay(tmp_path):
    store = Store(tmp_path / "t.db")
    store.set_module_state("course:module-1", "done", "готово")
    modules = {m.id: m for m in course_view(store)}
    assert modules["course:module-1"].status == "done"
    assert modules["course:module-1"].note == "готово"
    store.close()


def test_practice_journal_merged(tmp_path):
    store = Store(tmp_path / "t.db")
    store.add_journal_entry("practice:module-1", {"Цель": "x"})
    rows = {r.id: r for r in practice_view(store)}
    assert len(rows["practice:module-1"].journal) == 1
    assert rows["practice:module-1"].journal[0].data["Цель"] == "x"
    store.close()


def test_backlog_overlay(tmp_path):
    store = Store(tmp_path / "t.db")
    items = {i.id: i for i in backlog_view(store)}
    assert items["backlog:week-1:item-1"].done is False
    store.set_backlog_done("backlog:week-1:item-1", True)
    items = {i.id: i for i in backlog_view(store)}
    assert items["backlog:week-1:item-1"].done is True
    store.close()


def test_mvp_and_dod_default_false(tmp_path):
    store = Store(tmp_path / "t.db")
    assert all(c.done is False for c in mvp_view(store))
    assert all(d.done is False for d in dod_view(store))
    store.close()
