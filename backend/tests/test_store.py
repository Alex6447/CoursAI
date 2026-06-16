from app.store.db import Store


def test_module_state_roundtrip(tmp_path):
    db = tmp_path / "t.db"
    store = Store(db)
    assert store.get_module_state("course:module-1") is None
    store.set_module_state("course:module-1", "in_progress", "начал")
    state = store.get_module_state("course:module-1")
    assert state is not None
    assert state.status == "in_progress"
    assert state.note == "начал"
    store.close()


def test_persistence_across_reopen(tmp_path):
    db = tmp_path / "t.db"
    store = Store(db)
    store.set_module_state("course:module-5", "done")
    store.set_flag("mvp_state", "mvp:acceptance:item-1", True)
    store.close()

    reopened = Store(db)
    assert reopened.get_module_state("course:module-5").status == "done"
    assert reopened.all_flags("mvp_state")["mvp:acceptance:item-1"].done is True
    reopened.close()


def test_upsert_overwrites(tmp_path):
    store = Store(tmp_path / "t.db")
    store.set_module_state("course:module-1", "in_progress")
    store.set_module_state("course:module-1", "done", "готово")
    state = store.get_module_state("course:module-1")
    assert state.status == "done"
    assert state.note == "готово"
    store.close()


def test_journal(tmp_path):
    store = Store(tmp_path / "t.db")
    store.add_journal_entry("practice:module-1", {"Цель": "проверить split"})
    store.add_journal_entry("practice:module-1", {"Цель": "вторая запись"})
    entries = store.journal_for("practice:module-1")
    assert len(entries) == 2
    assert entries[0].data["Цель"] == "проверить split"
    assert entries[0].created_at
    store.close()


def test_backlog_done_sets_timestamp(tmp_path):
    store = Store(tmp_path / "t.db")
    store.set_backlog_done("backlog:week-1:item-1", True)
    states = store.all_backlog_states()
    assert states["backlog:week-1:item-1"].done is True
    assert states["backlog:week-1:item-1"].done_at
    store.close()
