# Production Dockerfile for Sentia Manufacturing Dashboard
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci --no-cache

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm ci --only=production --no-cache

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