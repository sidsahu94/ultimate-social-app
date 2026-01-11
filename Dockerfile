# Stage 1: Build Frontend
FROM node:18-alpine as client-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
# Install deps including devDependencies for Vite build
RUN npm install
COPY frontend/ ./
# Build React App to /app/frontend/dist
RUN npm run build

# Stage 2: Setup Backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production

# Copy Backend Source
COPY backend/ ./

# Copy Built Frontend from Stage 1 to Backend's public folder
# Note: Ensure your backend server.js points to 'frontend/dist' (we fixed this in previous steps)
COPY --from=client-build /app/frontend/dist ./frontend/dist

# Expose API Port
EXPOSE 5000

# Environment Variables Default (Can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=5000

# Start Server
CMD ["node", "server.js"]