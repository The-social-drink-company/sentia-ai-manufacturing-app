# Production Dockerfile for Sentia Manufacturing Dashboard
FROM node:20-alpine

# Install build dependencies for Alpine Linux (needed for Rollup)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies with fresh lockfile
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build (keep production dependencies)
RUN npm prune --production

# Set production environment
ENV NODE_ENV=production
ENV PORT=5002

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5002/api/health || exit 1

# Start the application
CMD ["node", "test-server.js"]