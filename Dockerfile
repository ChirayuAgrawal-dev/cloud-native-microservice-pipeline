# --- Stage 1: Build Stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# --- Stage 2: Production Run Stage ---
FROM node:18-alpine AS runner

WORKDIR /app

# Copy node modules and source files from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY ingest.js ./
COPY embeddings.js ./

# Expose port for the Express server
EXPOSE 3000

# Start the Node.js microservice
CMD ["npm", "start"]