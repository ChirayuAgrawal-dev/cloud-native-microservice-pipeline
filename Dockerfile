# --- Stage 1: Build Stage ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# --- Stage 2: Production Run Stage ---
FROM node:18-alpine AS runner
WORKDIR /app

# Copy production dependencies and source files securely
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./

# Run container as a non-root user for security best practices
USER node

EXPOSE 3000
CMD ["npm", "run", "start:prod"]