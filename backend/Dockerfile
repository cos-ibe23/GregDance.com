# ========= FRONTEND BUILD =========
FROM node:18 AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build


# ========= BACKEND =========
FROM node:18

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

# Copy React build into NestJS public folder
COPY --from=frontend-build /frontend/build ./public

EXPOSE 3001

CMD ["sh", "-c", "sleep 10 && npx prisma migrate deploy && npm run start"]