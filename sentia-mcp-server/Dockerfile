# Sentia Manufacturing MCP Server Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Stage 2: Production image
FROM node:18-alpine AS production

# Install security updates and necessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpserver -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY pnpm-lock.yaml* ./
RUN npm install -g pnpm && \
    pnpm install --prod --frozen-lockfile && \
    pnpm store prune && \
    rm -rf ~/.pnpm-store

# Copy application code
COPY --chown=mcpserver:nodejs . .

# Copy dependencies from builder stage
COPY --from=builder --chown=mcpserver:nodejs /app/node_modules ./node_modules

# Create required directories
RUN mkdir -p logs tmp src/tools && \
    chown -R mcpserver:nodejs logs tmp src/tools

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV MCP_SERVER_PORT=3001
ENV MCP_SERVER_HOST=0.0.0.0

# Expose ports
EXPOSE 3001 3002 3101

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER mcpserver

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "scripts/start-mcp-server.js"]

# Labels for better maintainability
LABEL maintainer="Sentia Manufacturing Team"
LABEL version="3.0.0"
LABEL description="Sentia Manufacturing MCP Server - Model Context Protocol server for manufacturing intelligence"
LABEL org.opencontainers.image.source="https://github.com/The-social-drink-company/sentia-manufacturing-dashboard"
LABEL org.opencontainers.image.description="Enterprise-grade MCP server for manufacturing operations"
LABEL org.opencontainers.image.licenses="MIT"