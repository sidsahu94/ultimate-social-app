# Stage 1: Build Frontend
FROM node:22-alpine3.20 AS client-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Setup Backend
FROM node:22-alpine3.20

# Add wget for healthcheck along with mediasoup dependencies
RUN apk add --no-cache python3 make g++ linux-headers wget

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY backend/package*.json ./backend/
WORKDIR /app/backend

# Modern npm production install
RUN npm ci --omit=dev

COPY --from=client-build /app/frontend/dist /app/frontend/dist
COPY backend/ .

# CRITICAL FIX: Transfer ownership BEFORE switching to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# CRITICAL FIX: Container Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

EXPOSE 5000
CMD ["npm", "start"]