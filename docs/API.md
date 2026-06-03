# REST API — IT Requests System

Базовый URL: `/api`. Авторизация: заголовок `Authorization: Bearer <token>`.

## Схема взаимодействия

```mermaid
sequenceDiagram
    participant Browser
    participant API
    participant DB

    Browser->>API: POST /auth/login
    API->>DB: SELECT user
    API-->>Browser: JWT token

    Browser->>API: GET /requests?search=...
    API->>DB: SELECT with filters
    API-->>Browser: JSON list

    Browser->>API: PUT /requests/:id
    API->>DB: UPDATE + INSERT history
    API-->>Browser: success
```

## Endpoints

| Метод | Путь | Описание | Роли |
|-------|------|----------|------|
| GET | `/health` | Проверка работоспособности | — |
| POST | `/auth/login` | Вход | — |
| POST | `/auth/register` | Регистрация | — |
| GET | `/categories` | Список категорий | auth |
| GET | `/requests` | Список заявок (фильтры: status, priority, category_id, search) | auth |
| GET | `/requests/:id` | Одна заявка | auth |
| POST | `/requests` | Создать заявку | auth |
| PUT | `/requests/:id` | Обновить заявку | auth / IT для статуса |
| DELETE | `/requests/:id` | Удалить заявку | creator (new) / IT |
| GET | `/requests/:id/comments` | Комментарии | auth |
| POST | `/requests/:id/comments` | Добавить комментарий | auth |
| GET | `/requests/:id/history` | История статусов | auth |
| GET | `/statistics` | Статистика | auth |
| GET | `/users/it-specialists` | Список исполнителей | auth |
