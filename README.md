# IT Requests System

Система учёта заявок и задач IT-отдела организации. Сотрудники создают обращения, IT-специалисты обрабатывают их: меняют статус, назначают исполнителей, оставляют комментарии.

## Функционал

- Регистрация и авторизация (JWT)
- Роли: **employee** (сотрудник) и **it_specialist** (IT)
- Заявки: создание, просмотр, редактирование, удаление (для новых)
- Категории, приоритеты, статусы
- Комментарии и история изменения статусов
- Поиск и фильтрация (статус, приоритет, категория)
- Статистика по заявкам
- Адаптивная вёрстка (desktop / mobile)

## Технологии

| Слой | Стек |
|------|------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| БД | SQLite |
| Контейнеры | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Деплой | Render.com (рекомендуется) |

## Структура проекта

```
it-requests-system/
├── backend/
│   ├── app.js              # REST API
│   ├── server.js           # Точка входа
│   ├── db.js               # Инициализация БД
│   ├── database/init.sql   # SQL-схема и демо-данные
│   └── tests/              # Автотесты
├── frontend/               # Клиентская часть
├── docs/                   # Документация для отчёта
├── Dockerfile
├── docker-compose.yaml
└── render.yaml             # Blueprint для Render
```

## Установка и запуск локально

### Требования

- Node.js 18+
- npm

### Шаги

```bash
git clone https://github.com/pirat-sudo/it-requests-system.git
cd it-requests-system/backend
cp ../.env.example ../.env   # при необходимости отредактируйте JWT_SECRET
npm install
npm start
```

Откройте в браузере: **http://localhost:3000**

### Демо-аккаунты

| Логин | Пароль | Роль |
|-------|--------|------|
| ivanov | password123 | Сотрудник |
| petrov | password123 | IT-специалист |
| sidorova | password123 | Сотрудник |
| kozlov, morozova, nikitina, orlov | password123 | Сотрудники |
| vasiliev | password123 | IT-специалист |

В системе **18 демо-заявок** (все статусы, приоритеты, категории). Для перезагрузки данных:

```bash
cd backend && npm run reseed && npm start
```

## Запуск через Docker

```bash
docker compose up --build
```

Приложение: **http://localhost:3000**

Остановка:

```bash
docker compose down
```

## Тесты

```bash
cd backend
npm install
npm test
```

Ручные тест-кейсы (25 шт.): [docs/TEST_CASES.md](docs/TEST_CASES.md)

## CI/CD

При push в `main` запускается [.github/workflows/ci.yml](.github/workflows/ci.yml):

1. `npm install` и `npm test`
2. Сборка Docker-образа
3. Проверка `/api/health` в контейнере

Опциональный деплой: [.github/workflows/deploy.yaml](.github/workflows/deploy.yaml) (нужен секрет `RENDER_DEPLOY_HOOK`).

## Публикация на Render.com

1. Создайте репозиторий на GitHub и загрузите проект.
2. На [Render](https://dashboard.render.com) → **New** → **Blueprint** или **Web Service**.
3. Подключите репозиторий, выберите **Docker**.
4. Добавьте переменную `JWT_SECRET`.
5. После деплоя укажите URL в README (раздел ниже).

Для автодеплоя из GitHub Actions добавьте секрет `RENDER_DEPLOY_HOOK` (URL из Render → Settings → Deploy Hook).

## Документация для отчёта

- [docs/DATABASE.md](docs/DATABASE.md) — ER-диаграмма, таблицы, SQL
- [docs/API.md](docs/API.md) — REST API и схема запросов
- [docs/TEST_CASES.md](docs/TEST_CASES.md) — тест-кейсы
- [docs/REPORT.md](docs/REPORT.md) — шаблон отчёта по практике

## Репозиторий и публикация

**GitHub:** https://github.com/pirat-sudo/it-requests-system

**Live (после деплоя на Railway):** по ссылке https://it-requests-system-production.up.railway.app/login.html

Чеклист технологий для отчёта: [docs/TECH_CHECKLIST.md](docs/TECH_CHECKLIST.md)

## Лицензия

Учебный проект — производственная практика.
