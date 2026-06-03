const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { initDatabase } = require('../db');
const { createApp, JWT_SECRET } = require('../app');
const jwt = require('jsonwebtoken');

let app;
let db;
let employeeToken;
let specialistToken;

before(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    db = await initDatabase(':memory:');
    app = createApp(db);

    const loginEmployee = await request(app)
        .post('/api/auth/login')
        .send({ username: 'ivanov', password: 'password123' });
    employeeToken = loginEmployee.body.token;

    const loginSpecialist = await request(app)
        .post('/api/auth/login')
        .send({ username: 'petrov', password: 'password123' });
    specialistToken = loginSpecialist.body.token;
});

after(() => {
    if (db) db.close();
});

test('health endpoint returns ok', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
});

test('login with valid credentials', async () => {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'ivanov', password: 'password123' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'employee');
});

test('login rejects invalid credentials', async () => {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'ivanov', password: 'wrong' });
    assert.equal(res.status, 401);
});

test('protected route requires token', async () => {
    const res = await request(app).get('/api/requests');
    assert.equal(res.status, 401);
});

test('get requests list for employee', async () => {
    const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${employeeToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
});

test('get single request by id', async () => {
    const res = await request(app)
        .get('/api/requests/1')
        .set('Authorization', `Bearer ${employeeToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, 1);
});

test('create request with validation', async () => {
    const bad = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Only title' });
    assert.equal(bad.status, 400);

    const ok = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
            title: 'Тестовая заявка',
            description: 'Описание тестовой заявки',
            priority: 'low',
            category_id: 2
        });
    assert.equal(ok.status, 201);
    assert.ok(ok.body.requestId);
});

test('filter requests by status', async () => {
    const res = await request(app)
        .get('/api/requests?status=new')
        .set('Authorization', `Bearer ${specialistToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.every((r) => r.status === 'new'));
});

test('search requests by text', async () => {
    const res = await request(app)
        .get(`/api/requests?search=${encodeURIComponent('принтер')}`)
        .set('Authorization', `Bearer ${specialistToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.length >= 1);
});

test('it specialist can update status', async () => {
    const res = await request(app)
        .put('/api/requests/1')
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({ status: 'in_progress', assigned_to: 2 });
    assert.equal(res.status, 200);
});

test('employee cannot change status', async () => {
    const res = await request(app)
        .put('/api/requests/2')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'closed' });
    assert.equal(res.status, 403);
});

test('categories endpoint returns data', async () => {
    const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${employeeToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.length >= 4);
});

test('add and read comments', async () => {
    const add = await request(app)
        .post('/api/requests/1/comments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ comment: 'Тестовый комментарий' });
    assert.equal(add.status, 201);

    const list = await request(app)
        .get('/api/requests/1/comments')
        .set('Authorization', `Bearer ${employeeToken}`);
    assert.equal(list.status, 200);
    assert.ok(list.body.some((c) => c.comment === 'Тестовый комментарий'));
});

test('reject empty comment', async () => {
    const res = await request(app)
        .post('/api/requests/1/comments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ comment: '   ' });
    assert.equal(res.status, 400);
});

test('status history is available', async () => {
    const res = await request(app)
        .get('/api/requests/2/history')
        .set('Authorization', `Bearer ${specialistToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.length >= 1);
});

test('register duplicate user fails', async () => {
    const res = await request(app)
        .post('/api/auth/register')
        .send({
            username: 'ivanov',
            password: 'newpass',
            fullName: 'Дубликат',
            role: 'employee'
        });
    assert.equal(res.status, 400);
});

test('invalid token is rejected', async () => {
    const res = await request(app)
        .get('/api/requests')
        .set('Authorization', 'Bearer invalid.token.value');
    assert.equal(res.status, 403);
});

test('delete new request by employee', async () => {
    const created = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Удаляемая', description: 'Для удаления', priority: 'low' });

    const deleted = await request(app)
        .delete(`/api/requests/${created.body.requestId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
    assert.equal(deleted.status, 200);
});
