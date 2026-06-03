# Отчёт по производственной практике

**Тема:** Система учёта заявок и задач IT-отдела организации  
**Проект:** IT Requests System

> Заполните поля в квадратных скобках своими данными и добавьте скриншоты в папку `docs/screenshots/`.

## 1. Анализ предметной области

IT-отдел обрабатывает обращения сотрудников: неисправное оборудование, установка ПО, проблемы с сетью. Требуется единая система для подачи заявок, назначения исполнителей и контроля статусов.

## 2. Требования к системе

- Регистрация и авторизация, роли: сотрудник / IT-специалист
- CRUD заявок, категории, комментарии, история статусов
- Поиск и фильтрация, адаптивный интерфейс
- REST API, SQLite, Docker, CI/CD, публикация в интернете

## 3. Проектирование БД

См. [DATABASE.md](./DATABASE.md) — ER-диаграмма, таблицы, примеры запросов.

## 4. Архитектура приложения

```
it-requests-system/
├── backend/          # Node.js + Express + SQLite
├── frontend/         # HTML/CSS/JS
├── docs/             # Документация для отчёта
├── .github/workflows/  # CI/CD
├── Dockerfile
└── docker-compose.yaml
```

## 5. Разработанные модули

| Модуль | Файлы |
|--------|-------|
| Авторизация | `backend/app.js`, `frontend/js/auth.js` |
| Заявки | `backend/app.js`, `frontend/js/dashboard.js` |
| Детали заявки | `frontend/js/request-detail.js` |
| БД | `backend/database/init.sql`, `backend/db.js` |

## 6. Тестирование

- Ручные тест-кейсы: [TEST_CASES.md](./TEST_CASES.md) (25 кейсов)
- Автотесты: `backend/tests/api.test.js`

## 7. Рефакторинг

- Выделены `app.js` и `db.js` для тестируемости
- Убрана жёсткая привязка API к localhost
- Добавлены категории и серверная фильтрация

## 8. Контейнеризация

```bash
docker compose up --build
```

Скриншот: `docs/screenshots/docker-running.png`

## 9. CI/CD

Workflow: `.github/workflows/ci.yml` — установка зависимостей, `npm test`, сборка Docker, health check.

Скриншот: `docs/screenshots/github-actions-success.png`

## 10. Деплой

| Параметр | Значение |
|----------|----------|
| Сервис | [Render.com](https://render.com) |
| URL приложения | [ВСТАВЬТЕ_ССЫЛКУ] |
| Репозиторий | [ВСТАВЬТЕ_ССЫЛКУ_GITHUB] |
| Команда сборки | Docker (см. `render.yaml`) |
| Deploy hook | GitHub Secret `RENDER_DEPLOY_HOOK` |

Скриншот: `docs/screenshots/render-deploy.png`

## 11. Заключение

Разработана рабочая fullstack-система учёта IT-заявок с авторизацией, ролями, REST API, БД, Docker, автотестами и CI/CD.
