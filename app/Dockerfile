# ==========================================
# Stage 1: Build Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

# ==========================================
# Stage 2: Hardened Runtime Container
# ==========================================
FROM node:20-alpine AS runner

# Security hardening: Run as non-root user
WORKDIR /usr/src/app

# Copy production node_modules from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./

# Set environment defaults & drop root privileges
ENV NODE_ENV=production \
    PORT=8080

USER node

EXPOSE 8080

# Use dumb-init or direct node execution for SIGTERM signal handling
CMD ["node", "server.js"]
