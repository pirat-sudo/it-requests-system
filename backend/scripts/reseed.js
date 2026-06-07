/**
 * Пересоздание демо-данных. Запуск: node scripts/reseed.js
 */
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('../db');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/it_requests.db');

if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Старая БД удалена');
}

initDatabase(dbPath)
    .then((db) => {
        db.close();
        console.log('Демо-данные успешно загружены');
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
