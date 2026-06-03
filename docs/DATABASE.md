# База данных — IT Requests System

СУБД: **SQLite**. Скрипт создания: `backend/database/init.sql`.

## ER-диаграмма

```mermaid
erDiagram
    users ||--o{ requests : creates
    users ||--o{ requests : assigned
    users ||--o{ comments : writes
    users ||--o{ status_history : changes
    categories ||--o{ requests : classifies
    requests ||--o{ comments : has
    requests ||--o{ status_history : tracks

    users {
        int id PK
        text username UK
        text password
        text full_name
        text role
        datetime created_at
    }

    categories {
        int id PK
        text name UK
        text description
    }

    requests {
        int id PK
        text title
        text description
        text status
        text priority
        int category_id FK
        int created_by FK
        int assigned_to FK
        datetime created_at
        datetime updated_at
    }

    comments {
        int id PK
        int request_id FK
        int user_id FK
        text comment
        datetime created_at
    }

    status_history {
        int id PK
        int request_id FK
        text old_status
        text new_status
        int changed_by FK
        datetime changed_at
    }
```

## Описание таблиц

| Таблица | Назначение |
|---------|------------|
| `users` | Пользователи системы (сотрудник / IT-специалист) |
| `categories` | Категории заявок (оборудование, ПО, сеть и т.д.) |
| `requests` | Заявки в IT-отдел |
| `comments` | Комментарии к заявкам |
| `status_history` | История изменения статусов |

## Примеры SQL-запросов

```sql
-- Все открытые заявки с категорией и автором
SELECT r.id, r.title, r.status, c.name AS category, u.full_name AS author
FROM requests r
LEFT JOIN categories c ON r.category_id = c.id
JOIN users u ON r.created_by = u.id
WHERE r.status IN ('new', 'in_progress')
ORDER BY r.created_at DESC;

-- Количество заявок по категориям
SELECT c.name, COUNT(r.id) AS total
FROM categories c
LEFT JOIN requests r ON c.id = r.category_id
GROUP BY c.id;

-- История статусов заявки №2
SELECT sh.old_status, sh.new_status, u.full_name, sh.changed_at
FROM status_history sh
JOIN users u ON sh.changed_by = u.id
WHERE sh.request_id = 2
ORDER BY sh.changed_at;
```

## Демо-данные

После инициализации доступны пользователи `ivanov`, `petrov`, `sidorova` (пароль `password123`) и три примера заявок.
