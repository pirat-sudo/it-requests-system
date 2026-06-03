const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

function createApp(db) {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../frontend')));

    const run = (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.run(sql, params, function onRun(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

    const get = (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

    const all = (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

    async function verifyPassword(password, storedPassword) {
        if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
            return bcrypt.compare(password, storedPassword);
        }
        return password === storedPassword;
    }

    function buildRequestsQuery(user, filters) {
        let query = `
            SELECT r.*,
                   c.name as category_name,
                   u1.full_name as created_by_name,
                   u2.full_name as assigned_to_name
            FROM requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u1 ON r.created_by = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            WHERE 1=1
        `;
        const params = [];

        if (user.role === 'employee') {
            query += ' AND r.created_by = ?';
            params.push(user.id);
        }

        if (filters.status && filters.status !== 'all') {
            query += ' AND r.status = ?';
            params.push(filters.status);
        }

        if (filters.priority && filters.priority !== 'all') {
            query += ' AND r.priority = ?';
            params.push(filters.priority);
        }

        if (filters.category_id && filters.category_id !== 'all') {
            query += ' AND r.category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.search) {
            query += ' AND (r.title LIKE ? OR r.description LIKE ?)';
            const term = `%${filters.search}%`;
            params.push(term, term);
        }

        query += ' ORDER BY r.created_at DESC';
        return { query, params };
    }

    async function canAccessRequest(user, requestId) {
        const request = await get('SELECT * FROM requests WHERE id = ?', [requestId]);
        if (!request) return { allowed: false, request: null };
        if (user.role === 'it_specialist' || request.created_by === user.id) {
            return { allowed: true, request };
        }
        return { allowed: false, request };
    }

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', service: 'it-requests-system' });
    });

    app.post('/api/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Логин и пароль обязательны' });
            }

            const user = await get('SELECT * FROM users WHERE username = ?', [username]);
            if (!user) {
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            const isValidPassword = await verifyPassword(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    role: user.role
                }
            });
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.post('/api/auth/register', async (req, res) => {
        try {
            const { username, password, fullName, role } = req.body;

            if (!username || !password || !fullName || !role) {
                return res.status(400).json({ error: 'Все поля обязательны' });
            }

            if (!['employee', 'it_specialist'].includes(role)) {
                return res.status(400).json({ error: 'Некорректная роль' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await run(
                'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
                [username, hashedPassword, fullName, role]
            );

            res.status(201).json({ message: 'Регистрация успешна', userId: result.lastID });
        } catch (err) {
            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Пользователь уже существует' });
            }
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.get('/api/categories', authenticateToken, async (req, res) => {
        try {
            const categories = await all('SELECT * FROM categories ORDER BY name');
            res.json(categories);
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.get('/api/requests', authenticateToken, async (req, res) => {
        try {
            const filters = {
                status: req.query.status,
                priority: req.query.priority,
                category_id: req.query.category_id,
                search: req.query.search
            };
            const { query, params } = buildRequestsQuery(req.user, filters);
            const rows = await all(query, params);
            res.json(rows);
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.get('/api/requests/:id', authenticateToken, async (req, res) => {
        try {
            const { allowed, request } = await canAccessRequest(req.user, req.params.id);
            if (!request) {
                return res.status(404).json({ error: 'Заявка не найдена' });
            }
            if (!allowed) {
                return res.status(403).json({ error: 'Нет доступа к заявке' });
            }

            const row = await get(
                `SELECT r.*,
                        c.name as category_name,
                        u1.full_name as created_by_name,
                        u2.full_name as assigned_to_name
                 FROM requests r
                 LEFT JOIN categories c ON r.category_id = c.id
                 LEFT JOIN users u1 ON r.created_by = u1.id
                 LEFT JOIN users u2 ON r.assigned_to = u2.id
                 WHERE r.id = ?`,
                [req.params.id]
            );
            res.json(row);
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.post('/api/requests', authenticateToken, async (req, res) => {
        try {
            const { title, description, priority, category_id } = req.body;

            if (!title || !description) {
                return res.status(400).json({ error: 'Заголовок и описание обязательны' });
            }

            const result = await run(
                'INSERT INTO requests (title, description, priority, category_id, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, description, priority || 'medium', category_id || null, req.user.id]
            );

            await run(
                'INSERT INTO status_history (request_id, new_status, changed_by) VALUES (?, ?, ?)',
                [result.lastID, 'new', req.user.id]
            );

            res.status(201).json({ message: 'Заявка создана', requestId: result.lastID });
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.put('/api/requests/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, priority, status, assigned_to, category_id } = req.body;

            const { allowed, request } = await canAccessRequest(req.user, id);
            if (!request) {
                return res.status(404).json({ error: 'Заявка не найдена' });
            }
            if (!allowed) {
                return res.status(403).json({ error: 'Нет доступа к заявке' });
            }

            const updates = [];
            const params = [];

            if (title) {
                updates.push('title = ?');
                params.push(title);
            }
            if (description) {
                updates.push('description = ?');
                params.push(description);
            }
            if (priority) {
                updates.push('priority = ?');
                params.push(priority);
            }
            if (category_id !== undefined) {
                updates.push('category_id = ?');
                params.push(category_id);
            }

            if (req.user.role === 'it_specialist') {
                if (status) {
                    updates.push('status = ?');
                    params.push(status);
                    if (status !== request.status) {
                        await run(
                            'INSERT INTO status_history (request_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
                            [id, request.status, status, req.user.id]
                        );
                    }
                }
                if (assigned_to !== undefined) {
                    updates.push('assigned_to = ?');
                    params.push(assigned_to);
                }
            } else if (status || assigned_to !== undefined) {
                return res.status(403).json({ error: 'Недостаточно прав для изменения статуса' });
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'Нет данных для обновления' });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            await run(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`, params);
            res.json({ message: 'Заявка обновлена' });
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
        try {
            const { allowed, request } = await canAccessRequest(req.user, req.params.id);
            if (!request) {
                return res.status(404).json({ error: 'Заявка не найдена' });
            }

            const canDelete =
                req.user.role === 'it_specialist' ||
                (req.user.role === 'employee' && request.created_by === req.user.id && request.status === 'new');

            if (!canDelete) {
                return res.status(403).json({ error: 'Нельзя удалить эту заявку' });
            }

            await run('DELETE FROM requests WHERE id = ?', [req.params.id]);
            res.json({ message: 'Заявка удалена' });
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.get('/api/requests/:id/comments', authenticateToken, async (req, res) => {
        try {
            const { allowed, request } = await canAccessRequest(req.user, req.params.id);
            if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
            if (!allowed) return res.status(403).json({ error: 'Нет доступа к заявке' });

            const rows = await all(
                `SELECT c.*, u.full_name as user_name, u.role as user_role
                 FROM comments c
                 JOIN users u ON c.user_id = u.id
                 WHERE c.request_id = ?
                 ORDER BY c.created_at ASC`,
                [req.params.id]
            );
            res.json(rows);
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.post('/api/requests/:id/comments', authenticateToken, async (req, res) => {
        try {
            const { comment } = req.body;
            if (!comment || comment.trim() === '') {
                return res.status(400).json({ error: 'Комментарий не может быть пустым' });
            }

            const { allowed, request } = await canAccessRequest(req.user, req.params.id);
            if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
            if (!allowed) return res.status(403).json({ error: 'Нет доступа к заявке' });

            const result = await run(
                'INSERT INTO comments (request_id, user_id, comment) VALUES (?, ?, ?)',
                [req.params.id, req.user.id, comment.trim()]
            );
            res.status(201).json({ message: 'Комментарий добавлен', commentId: result.lastID });
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.get('/api/requests/:id/history', authenticateToken, async (req, res) => {
        try {
            const { allowed, request } = await canAccessRequest(req.user, req.params.id);
            if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
            if (!allowed) return res.status(403).json({ error: 'Нет доступа к заявке' });

            const rows = await all(
                `SELECT sh.*, u.full_name as changed_by_name
                 FROM status_history sh
                 JOIN users u ON sh.changed_by = u.id
                 WHERE sh.request_id = ?
                 ORDER BY sh.changed_at DESC`,
                [req.params.id]
            );
            res.json(rows);
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.get('/api/statistics', authenticateToken, async (req, res) => {
        try {
            const general = await get(
                `SELECT
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_requests,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_requests,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_requests,
                    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_requests
                 FROM requests`
            );
            const byPriority = await all(
                'SELECT priority, COUNT(*) as count FROM requests GROUP BY priority'
            );
            const byUser = await all(
                `SELECT u.full_name, COUNT(r.id) as request_count
                 FROM users u
                 LEFT JOIN requests r ON u.id = r.created_by
                 WHERE u.role = 'employee'
                 GROUP BY u.id`
            );
            const byCategory = await all(
                `SELECT c.name, COUNT(r.id) as count
                 FROM categories c
                 LEFT JOIN requests r ON c.id = r.category_id
                 GROUP BY c.id`
            );

            res.json({ general, byPriority, byUser, byCategory });
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.get('/api/users/it-specialists', authenticateToken, async (req, res) => {
        try {
            const rows = await all(
                'SELECT id, full_name, username FROM users WHERE role = ?',
                ['it_specialist']
            );
            res.json(rows);
        } catch {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    return app;
}

module.exports = { createApp, JWT_SECRET };
