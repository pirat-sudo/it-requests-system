const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function initDatabase(dbPath = './database/it_requests.db') {
    const dir = path.dirname(dbPath);
    if (dbPath !== ':memory:' && dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath);
    const sqlScript = fs.readFileSync(path.join(__dirname, 'database', 'init.sql'), 'utf8');

    return new Promise((resolve, reject) => {
        db.exec(sqlScript, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

module.exports = { initDatabase };
