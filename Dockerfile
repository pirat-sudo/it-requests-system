# 1. Возвращаемся к стандартному и легкому образу Node
FROM node:18-bookworm

WORKDIR /app/backend

# 2. Копируем файлы зависимостей бэкенда
COPY backend/package*.json ./

# 3. Принудительно собираем sqlite3 из исходников внутри контейнера.
#    Это раз и навсегда уберет ошибку GLIBC_2.38!
RUN npm install --omit=dev --build-from-source

# 4. Копируем остальной код бэкенда
COPY backend/ ./

# 5. Копируем фронтенд и настраиваем права
COPY frontend/ ../frontend/
RUN mkdir -p /app/backend/database && chmod 777 /app/backend/database

EXPOSE 3000

CMD ["node", "server.js"]
