from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.schemas import (
    DonePatch,
    JournalCreate,
    MetricPatch,
    ModulePatch,
    OkResponse,
    PracticePatch,
)
from app.services import merge, overview
from app.store.db import Store

router = APIRouter()

_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store


# --- чтение ---
@router.get("/overview")
def get_overview(store: Store = Depends(get_store)):
    return overview.build(store)


@router.get("/course")
def get_course(store: Store = Depends(get_store)):
    return merge.course_view(store)


@router.get("/practice")
def get_practice(store: Store = Depends(get_store)):
    return merge.practice_view(store)


@router.get("/backlog")
def get_backlog(store: Store = Depends(get_store)):
    return merge.backlog_view(store)


@router.get("/metrics")
def get_metrics(store: Store = Depends(get_store)):
    return merge.metrics_view(store)


@router.get("/mvp")
def get_mvp(store: Store = Depends(get_store)):
    return merge.mvp_view(store)


@router.get("/dod")
def get_dod(store: Store = Depends(get_store)):
    return merge.dod_view(store)


# --- обновление состояния ---
@router.patch("/course/{id:path}", response_model=OkResponse)
def patch_module(id: str, patch: ModulePatch, store: Store = Depends(get_store)):
    # Если note в запросе не передан — сохраняем существующий, чтобы смена статуса
    # из UI не затирала ранее введённую заметку.
    cur = store.get_module_state(id)
    note = patch.note if patch.note is not None else (cur.note if cur else "")
    store.set_module_state(id, patch.status, note)
    return OkResponse(id=id)


@router.patch("/practice/{id:path}", response_model=OkResponse)
def patch_practice(id: str, patch: PracticePatch, store: Store = Depends(get_store)):
    cur = store.get_practice_state(id)
    status = patch.status if patch.status is not None else (cur.status if cur else "not-started")
    artifact = (
        patch.artifact_url
        if patch.artifact_url is not None
        else (cur.artifact_url if cur else "")
    )
    store.set_practice_state(id, status, artifact)
    return OkResponse(id=id)


@router.post("/practice/{id:path}/journal", response_model=OkResponse)
def add_journal(id: str, body: JournalCreate, store: Store = Depends(get_store)):
    store.add_journal_entry(id, body.data)
    return OkResponse(id=id)


@router.patch("/backlog/{id:path}", response_model=OkResponse)
def patch_backlog(id: str, patch: DonePatch, store: Store = Depends(get_store)):
    store.set_backlog_done(id, patch.done)
    return OkResponse(id=id)


@router.patch("/metric/{id:path}", response_model=OkResponse)
def patch_metric(id: str, patch: MetricPatch, store: Store = Depends(get_store)):
    cur = store.all_metric_states().get(id)
    current_value = (
        patch.current_value
        if patch.current_value is not None
        else (cur.current_value if cur else "")
    )
    done = patch.done if patch.done is not None else (cur.done if cur else False)
    store.set_metric_state(id, current_value, done)
    return OkResponse(id=id)


@router.patch("/mvp/{id:path}", response_model=OkResponse)
def patch_mvp(id: str, patch: DonePatch, store: Store = Depends(get_store)):
    store.set_flag("mvp_state", id, patch.done)
    return OkResponse(id=id)


@router.patch("/dod/{id:path}", response_model=OkResponse)
def patch_dod(id: str, patch: DonePatch, store: Store = Depends(get_store)):
    store.set_flag("dod_state", id, patch.done)
    return OkResponse(id=id)
