# ============================================================================
# Stage 1: Build React + Vite + MapLibre GL Frontend
# ============================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ============================================================================
# Stage 2: Production Node.js + Express Server (Serves API + Built Frontend)
# ============================================================================
FROM node:22-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN npm --prefix backend install --omit=dev

# Copy backend source code
COPY backend/src ./backend/src
RUN mkdir -p /app/backend/uploads

# Copy compiled frontend static bundle from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "src/index.js"]
