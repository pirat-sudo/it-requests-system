require('dotenv').config();

const { initDatabase } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './database/it_requests.db';

async function start() {
    try {
        const db = await initDatabase(DB_PATH);
        const app = createApp(db);

        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`);
        });
    } catch (err) {
        console.error('Ошибка запуска:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    start();
}
