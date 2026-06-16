import pytest
from fastapi.testclient import TestClient

from app.api.routes import get_store
from app.main import app
from app.store.db import Store


@pytest.fixture()
def client(tmp_path):
    store = Store(tmp_path / "api.db")
    app.dependency_overrides[get_store] = lambda: store
    yield TestClient(app)
    app.dependency_overrides.clear()
    store.close()


def test_get_course(client):
    resp = client.get("/course")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 10
    assert data[0]["id"] == "course:module-1"
    assert data[0]["status"] == "not_started"


def test_all_get_endpoints(client):
    for path in ("/course", "/practice", "/backlog", "/metrics", "/mvp", "/dod"):
        resp = client.get(path)
        assert resp.status_code == 200, path
        assert isinstance(resp.json(), list)
        assert resp.json(), f"{path} пустой"


def test_patch_module_persists(client):
    resp = client.patch("/course/course:module-1", json={"status": "done", "note": "ок"})
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    modules = {m["id"]: m for m in client.get("/course").json()}
    assert modules["course:module-1"]["status"] == "done"
    assert modules["course:module-1"]["note"] == "ок"


def test_patch_checkbox_endpoints(client):
    assert client.patch("/backlog/backlog:week-1:item-1", json={"done": True}).status_code == 200
    assert client.patch("/mvp/mvp:acceptance:item-1", json={"done": True}).status_code == 200
    assert client.patch("/dod/dod:item-1", json={"done": True}).status_code == 200

    backlog = {i["id"]: i for i in client.get("/backlog").json()}
    assert backlog["backlog:week-1:item-1"]["done"] is True


def test_overview_empty_state(client):
    data = client.get("/overview").json()
    assert data["theory"]["percent"] == 0
    assert data["practice"]["percent"] == 0
    assert data["projects"]["percent"] == 0
    focus = data["current_focus"]
    assert focus["kind"] == "backlog"
    assert focus["id"] == "backlog:week-1:item-1"
    assert focus["screen"] == "/backlog"


def test_overview_percentages_grow(client):
    before = client.get("/overview").json()["theory"]
    client.patch("/course/course:module-1", json={"status": "done"})
    after = client.get("/overview").json()["theory"]
    assert after["done"] == before["done"] + 1
    assert after["percent"] > before["percent"]


def test_overview_focus_advances_past_backlog(client):
    # Закрываем все пункты backlog — фокус должен уйти на курс или MVP.
    backlog = client.get("/backlog").json()
    for item in backlog:
        client.patch(f"/backlog/{item['id']}", json={"done": True})
    focus = client.get("/overview").json()["current_focus"]
    assert focus["kind"] in ("course", "mvp", "done")


def test_journal_post(client):
    resp = client.post(
        "/practice/practice:module-1/journal", json={"data": {"Цель": "split"}}
    )
    assert resp.status_code == 200
    rows = {r["id"]: r for r in client.get("/practice").json()}
    journal = rows["practice:module-1"]["journal"]
    assert len(journal) == 1
    assert journal[0]["data"]["Цель"] == "split"
