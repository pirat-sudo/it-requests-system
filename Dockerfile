# 1. Используем образ на базе Ubuntu 24.04 (Noble), где точно есть GLIBC 2.38+
FROM node:18-noble

WORKDIR /app/backend

# 2. Копируем файлы зависимостей
COPY backend/package*.json ./

# 3. Устанавливаем зависимости начисто
RUN npm install --omit=dev

# 4. Копируем остальной код бэкенда
COPY backend/ ./

# 5. Копируем фронтенд и настраиваем права
COPY frontend/ ../frontend/
RUN mkdir -p /app/backend/database && chmod 777 /app/backend/database

EXPOSE 3000

CMD ["node", "server.js"]
