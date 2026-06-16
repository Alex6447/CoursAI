---
title: Трекер практики курса ML Training
type: tracker
status: active
created: 2026-05-30
tags: [ml, course, practice, tracker, aimarket]
---

# Трекер практики курса ML Training

Связанный курс: [[course-ml-training]].  
Коммерческий капстоун: [[rag-mvp-spec]].  
Цель: не просто «изучить», а оставить доказательства, что ты можешь собрать рабочий ML/LLM-сервис под [[solo-monetization-plan]].

## Таблица прогресса

| Модуль | Статус | Артефакт | Метрика/критерий | Ссылка/заметка |
|---|---|---|---|---|
| 1. Фундамент обучения и метрики | not-started | Ноутбук sklearn + графики | train/val/test, F1/precision/recall, overfit fix |  |
| 2. PyTorch training loop | not-started | Скрипт/ноутбук PyTorch | seed, checkpoint, best val metric |  |
| 3. Transfer learning | not-started | Сравнение 3 режимов | таблица качество/время |  |
| 4. NLP/LLM basics | not-started | Эмбеддинги + semantic search | nearest texts объяснимы |  |
| 5. RAG | not-started | RAG prototype | ответы с источниками, 10–15 вопросов | [[rag-mvp-spec]] |
| 6. LoRA/QLoRA | not-started | Мини fine-tuning | `base vs LoRA` на holdout |  |
| 7. ASR/TTS | not-started | Audio → transcript → summary | WER посчитан |  |
| 8. CV detection | optional | Детектор одного класса | mAP посчитан |  |
| 9. Eval + production | not-started | API + cost sheet | latency/cost/quality |  |
| 10. Capstone | not-started | Портфельный кейс | demo + README + one-pager | [[offer-and-client-acquisition]] |

## Шаблон записи по заданию

```markdown
## YYYY-MM-DD — модуль N, задание

**Цель:**  
**Датасет/документы:**  
**Код/репозиторий:**  
**Метрики:**  
**Что получилось:**  
**Что сломалось:**  
**Что понял:**  
**Что переносится в MVP:**  
**Следующий шаг:**  
```

## Правила зачёта

- Не засчитывать модуль без кода или измеримого результата.
- Не засчитывать RAG без источников в ответе.
- Не засчитывать fine-tuning без сравнения с baseline.
- Не засчитывать продакшн-модуль без расчёта себестоимости запроса.
- Не засчитывать капстоун без demo/readme/one-pager.

## Журнал

### 2026-05-30 — старт

Создан трекер. Первое действие: закрыть модуль 1 и выбрать документы для [[rag-mvp-spec|RAG MVP]].

