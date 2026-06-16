from __future__ import annotations

from pydantic import BaseModel


class ModulePatch(BaseModel):
    status: str
    note: str | None = None


class PracticePatch(BaseModel):
    status: str | None = None
    artifact_url: str | None = None


class DonePatch(BaseModel):
    done: bool


class MetricPatch(BaseModel):
    current_value: str | None = None
    done: bool | None = None


class JournalCreate(BaseModel):
    data: dict


class OkResponse(BaseModel):
    ok: bool = True
    id: str
