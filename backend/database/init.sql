BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER,
	"username"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"full_name"	TEXT NOT NULL,
	"role"	TEXT NOT NULL CHECK("role" IN ('employee', 'it_specialist')),
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "categories" (
	"id"	INTEGER,
	"name"	TEXT NOT NULL UNIQUE,
	"description"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "requests" (
	"id"	INTEGER,
	"title"	TEXT NOT NULL,
	"description"	TEXT NOT NULL,
	"status"	TEXT DEFAULT 'new' CHECK("status" IN ('new', 'in_progress', 'resolved', 'closed')),
	"priority"	TEXT DEFAULT 'medium' CHECK("priority" IN ('low', 'medium', 'high', 'critical')),
	"category_id"	INTEGER,
	"created_by"	INTEGER NOT NULL,
	"assigned_to"	INTEGER,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("assigned_to") REFERENCES "users"("id"),
	FOREIGN KEY("created_by") REFERENCES "users"("id"),
	FOREIGN KEY("category_id") REFERENCES "categories"("id")
);

CREATE TABLE IF NOT EXISTS "comments" (
	"id"	INTEGER,
	"request_id"	INTEGER NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"comment"	TEXT NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("request_id") REFERENCES "requests"("id") ON DELETE CASCADE,
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "status_history" (
	"id"	INTEGER,
	"request_id"	INTEGER NOT NULL,
	"old_status"	TEXT,
	"new_status"	TEXT NOT NULL,
	"changed_by"	INTEGER NOT NULL,
	"changed_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("changed_by") REFERENCES "users"("id"),
	FOREIGN KEY("request_id") REFERENCES "requests"("id") ON DELETE CASCADE
);

INSERT OR IGNORE INTO "categories" ("id", "name", "description") VALUES
(1, 'Оборудование', 'Заявки на ремонт или замену техники'),
(2, 'Программное обеспечение', 'Установка, обновление и настройка ПО'),
(3, 'Сеть и доступ', 'VPN, Wi-Fi, учётные записи и права доступа'),
(4, 'Прочее', 'Другие обращения в IT-отдел');

INSERT OR IGNORE INTO "users" ("id", "username", "password", "full_name", "role") VALUES
(1, 'ivanov', 'password123', 'Иван Иванов', 'employee'),
(2, 'petrov', 'password123', 'Пётр Петров', 'it_specialist'),
(3, 'sidorova', 'password123', 'Анна Сидорова', 'employee');

INSERT OR IGNORE INTO "requests" ("id", "title", "description", "status", "priority", "category_id", "created_by", "assigned_to") VALUES
(1, 'Не работает принтер в бухгалтерии', 'При печати документов принтер HP выдаёт ошибку бумаги, хотя бумага загружена.', 'new', 'high', 1, 1, NULL),
(2, 'Установить Microsoft Teams', 'Нужна установка Teams на рабочий ноутбук нового сотрудника отдела продаж.', 'in_progress', 'medium', 2, 3, 2),
(3, 'Нет доступа к корпоративной сети', 'После смены пароля не подключается VPN Cisco AnyConnect.', 'resolved', 'critical', 3, 1, 2);

INSERT OR IGNORE INTO "comments" ("request_id", "user_id", "comment") VALUES
(2, 2, 'Установка запланирована на сегодня после 15:00.'),
(3, 2, 'Проблема решена: сброшен кэш VPN-клиента.');

INSERT OR IGNORE INTO "status_history" ("request_id", "old_status", "new_status", "changed_by") VALUES
(1, NULL, 'new', 1),
(2, NULL, 'new', 3),
(2, 'new', 'in_progress', 2),
(3, NULL, 'new', 1),
(3, 'new', 'in_progress', 2),
(3, 'in_progress', 'resolved', 2);

CREATE INDEX IF NOT EXISTS "idx_requests_status" ON "requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_requests_priority" ON "requests" ("priority");
CREATE INDEX IF NOT EXISTS "idx_requests_category_id" ON "requests" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_requests_created_by" ON "requests" ("created_by");
CREATE INDEX IF NOT EXISTS "idx_requests_assigned_to" ON "requests" ("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_comments_request_id" ON "comments" ("request_id");
CREATE INDEX IF NOT EXISTS "idx_status_history_request_id" ON "status_history" ("request_id");

COMMIT;
