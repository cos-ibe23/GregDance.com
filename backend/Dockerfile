# ---------- FRONTEND BUILD ----------
FROM node:18 AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build


# ---------- BACKEND ----------
FROM node:18

WORKDIR /app

COPY backend/package*.json ./
RUN npm install


COPY backend ./
RUN npx prisma generate

# ✅ Copy built frontend into backend
COPY --from=frontend-build /app/frontend/build ./public

EXPOSE 3000

CMD ["sh", "-c", "sleep 10 && npx prisma migrate deploy && npm run start"]