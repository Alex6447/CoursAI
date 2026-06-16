# CoursAI — дашборд управления ML-обучением

## Что это
Десктоп-приложение (Electron), которое наглядно показывает «где я сейчас и над чем
работать» в процессе ML-обучения, и прогресс по трём измерениям: Теория → Практика →
Проекты. Источник структуры — Markdown-документы в `docs/` (курс, трекер практики,
90-дневный backlog, RAG MVP). Подробное описание — `docs/project.md`.

Репозиторий одновременно является **Obsidian-vault** (`.obsidian/`), документы в `docs/`
используют Obsidian-разметку (frontmatter, wikilinks, callouts, mermaid).

## Архитектура (зафиксированные решения)
- **Electron + React + TypeScript + Vite**, сборка десктопа через `electron-vite`.
- **Бэкенд на Python (FastAPI)** запускается Electron как дочерний процесс; фронт ходит
  по REST на `127.0.0.1`.
- **Прогресс хранится в SQLite** в `userData`. Исходные `.md` в `docs/` — **read-only**,
  их нельзя модифицировать из приложения.
- Структура парсится из Markdown и накладывается на состояние прогресса по стабильным `id`.

## Ключевые документы
- `docs/project.md` — базовое описание проекта.
- `docs/tasks/implementation-backlog.md` — план реализации (эпики E1–E7, задачи с критериями).
- `docs/tasks/prompt-generate-implementation-backlog.md` — промт, которым сгенерирован бэклог.
- `docs/course-ml-training.md`, `docs/ml-training-practice-log.md`,
  `docs/solo-90-day-execution-backlog.md`, `docs/rag-mvp-spec.md`,
  `docs/aimarket-dashboard.md` — источники данных для дашборда.

## Правила работы
- **Дизайн UI делать ТОЛЬКО через скилл `frontend-design`.** Не верстать «из головы».
- Не модифицировать документы в `docs/` из кода приложения — они read-only источник.
- Следовать порядку задач из `docs/tasks/implementation-backlog.md` (упорядочены по зависимостям).
- Платформа разработки — Windows 11, оболочка PowerShell. Учитывать пути и команды.
- Принцип минимального воздействия: делать ровно то, что в задаче, без фич сверх scope.

## Окружение
- Node `v24`, npm `v11`, Python `3.13`.
