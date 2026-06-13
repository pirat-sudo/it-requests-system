# 1. Используем современный образ Bookworm, где гарантированно есть свежий GLIBC
FROM node:18-bookworm

WORKDIR /app/backend

# 2. Копируем файлы зависимостей
COPY backend/package*.json ./

# 3. Принудительно очищаем и устанавливаем зависимости внутри Linux
RUN npm install --omit=dev

# 4. Копируем остальной код бэкенда
COPY backend/ ./

# 5. Гарантируем, что локальный node_modules (если он просочился через COPY) удален,
#    чтобы работали только что скомпилированные в контейнере пакеты
RUN rm -rf node_modules && npm install --omit=dev

# 6. Копируем фронтенд и настраиваем права
COPY frontend/ ../frontend/
RUN mkdir -p /app/backend/database && chmod 777 /app/backend/database

EXPOSE 3000

CMD ["node", "server.js"]
