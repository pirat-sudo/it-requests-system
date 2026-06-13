# 1. Используем чистую Ubuntu 24.04, где системный GLIBC равен 2.39 (что выше требуемого 2.38)
FROM ubuntu:24.04

# 2. Устанавливаем Node.js 18 и базовые системные инструменты
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://nodesource.com | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# 3. Копируем файлы зависимостей бэкенда
COPY backend/package*.json ./

# 4. Устанавливаем зависимости с нуля
RUN npm install --omit=dev

# 5. Копируем остальной код бэкенда
COPY backend/ ./

# 6. Копируем фронтенд и выставляем права на директорию базы данных
COPY frontend/ ../frontend/
RUN mkdir -p /app/backend/database && chmod 777 /app/backend/database

EXPOSE 3000

CMD ["node", "server.js"]
