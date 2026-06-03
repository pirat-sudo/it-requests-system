FROM node:18

WORKDIR /app/backend

# Копируем ТОЛЬКО package.json
COPY backend/package*.json ./

# Устанавливаем зависимости в контейнере
RUN npm install --omit=dev

# Копируем остальной код (node_modules будут пропущены через .dockerignore)
COPY backend/ ./
COPY frontend/ ../frontend/

RUN mkdir -p /app/backend/database && chmod 777 /app/backend/database

EXPOSE 3000

CMD ["node", "server.js"]
