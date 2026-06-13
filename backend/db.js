const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const MIN_DEMO_REQUESTS = 15;

function runExec(db, sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });
}

function runGet(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
}

async function ensureDemoData(db) {
    if (process.env.SKIP_DEMO_SEED === 'true') return;

    const row = await runGet(db, 'SELECT COUNT(*) as count FROM requests');
    if (row.count >= MIN_DEMO_REQUESTS) return;

    const seedPath = path.join(__dirname, 'database', 'seed-data.sql');
    if (!fs.existsSync(seedPath)) return;

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await runExec(db, seedSql);
    console.log(`Демо-данные загружены (${MIN_DEMO_REQUESTS}+ заявок)`);
}

function initDatabase(dbPath = './database/it_requests.db') {
    const dir = path.dirname(dbPath);
    if (dbPath !== ':memory:' && dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath);
    const sqlScript = fs.readFileSync(path.join(__dirname, 'database', 'init.sql'), 'utf8');

    return runExec(db, sqlScript)
        .then(() => ensureDemoData(db))
        .then(() => db);
}

module.exports = { initDatabase, ensureDemoData };
