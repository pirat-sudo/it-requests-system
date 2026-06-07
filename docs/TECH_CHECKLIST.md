# Соответствие требованиям задания

| Требование | Реализация | Где посмотреть |
|------------|------------|----------------|
| Fullstack-приложение | Frontend + Backend + БД | `frontend/`, `backend/` |
| Клиентская часть | HTML/CSS/JS, формы, список, карточка, поиск, фильтры | `frontend/` |
| Адаптивная вёрстка | Media queries 768px / 380px, touch-цели 44px | `frontend/css/style.css` |
| Серверная часть | Node.js + Express | `backend/app.js` |
| Авторизация | JWT, login/register | `POST /api/auth/login` |
| Роли | employee / it_specialist | `users.role`, проверки в API |
| Заявки CRUD | GET/POST/PUT/DELETE | `backend/app.js` |
| Статусы, категории | Таблицы + фильтры | `init.sql`, dashboard |
| Комментарии | POST/GET + автообновление каждые 4 сек | `request-detail.js` |
| История изменений | `status_history` | карточка заявки |
| База данных SQLite | SQL-скрипт, связи, индексы | `backend/database/init.sql` |
| ER-диаграмма | Mermaid | `docs/DATABASE.md` |
| REST API | 13+ endpoints | `docs/API.md` |
| Git | Репозиторий, README, .gitignore | корень проекта |
| Docker | Dockerfile | `Dockerfile` |
| Docker Compose | 2 сервиса не нужно — один контейнер + volume БД | `docker-compose.yaml` |
| Тестирование | 25 тест-кейсов + автотесты | `docs/TEST_CASES.md`, `backend/tests/` |
| CI/CD | GitHub Actions | `.github/workflows/ci.yml` |
| Деплой | Render blueprint | `render.yaml`, README |

## Ссылка на репозиторий

**https://github.com/pirat-sudo/it-requests-system**

## Демо-данные

18 заявок, 8 пользователей, 17 комментариев — все статусы, приоритеты и категории.

Перезагрузка демо-данных:

```bash
cd backend
npm run reseed
npm start
```
