from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import frontmatter

# Логические ключи источников → имена файлов в docs/.
# Это документы, из которых дашборд извлекает сущности (см. модель данных бэклога).
SOURCE_DOCS: dict[str, str] = {
    "course": "course-ml-training.md",
    "practice": "ml-training-practice-log.md",
    "backlog": "solo-90-day-execution-backlog.md",
    "mvp": "rag-mvp-spec.md",
    "dashboard": "aimarket-dashboard.md",
}


@dataclass(frozen=True)
class LoadedDoc:
    key: str
    path: Path
    frontmatter: dict
    body: str

    @property
    def title(self) -> str:
        return str(self.frontmatter.get("title", ""))

    @property
    def doc_type(self) -> str:
        return str(self.frontmatter.get("type", ""))


def find_docs_dir(start: Path | None = None) -> Path:
    """Найти каталог docs/, поднимаясь вверх от текущего файла.

    Работает и в dev (backend/app/parsing/), и при иной раскладке: ищем ближайший
    родительский каталог, содержащий docs/ с нужными источниками.
    """
    base = (start or Path(__file__)).resolve()
    for parent in [base, *base.parents]:
        candidate = parent / "docs"
        if candidate.is_dir() and (candidate / SOURCE_DOCS["course"]).is_file():
            return candidate
    raise FileNotFoundError("Не найден каталог docs/ с исходными документами")


def load_doc(key: str, docs_dir: Path | None = None) -> LoadedDoc:
    if key not in SOURCE_DOCS:
        raise KeyError(f"Неизвестный источник: {key}")
    docs_dir = docs_dir or find_docs_dir()
    path = docs_dir / SOURCE_DOCS[key]
    post = frontmatter.load(path)
    return LoadedDoc(key=key, path=path, frontmatter=dict(post.metadata), body=post.content)


def load_all(docs_dir: Path | None = None) -> dict[str, LoadedDoc]:
    docs_dir = docs_dir or find_docs_dir()
    return {key: load_doc(key, docs_dir) for key in SOURCE_DOCS}
