# ==========================================
# Stage 1: Build Frontend (React/Vite)
# ==========================================
FROM node:18-alpine as client-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies (using legacy-peer-deps to avoid conflicts with older UI libs)
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Set Environment Variable for Build Time
# This ensures Vite points API calls to the relative path '/api' (handled by Nginx/Express proxy)
ENV VITE_API_URL=/api

# Build the static assets (outputs to /app/frontend/dist)
RUN npm run build

# ==========================================
# Stage 2: Setup Backend (Express)
# ==========================================
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install ONLY production dependencies for the server (lighter image)
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# ==========================================
# Stage 3: Merge & Finalize
# ==========================================

# Copy the built frontend assets from Stage 1 into the backend's directory structure
# Your server.js is configured to serve static files from 'frontend/dist'
COPY --from=client-build /app/frontend/dist ./frontend/dist

# Expose the API port
EXPOSE 5000

# Set default environment variables (can be overridden by docker-compose)
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["node", "server.js"]