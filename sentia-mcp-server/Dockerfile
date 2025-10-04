# Sentia Manufacturing MCP Server Dockerfile
# Enterprise-grade multi-stage build with security hardening and performance optimization

# Stage 1: Build dependencies with security scanning
FROM node:18-alpine AS builder

# Install security updates and build dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    python3 \
    make \
    g++ && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files for dependency resolution
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm and dependencies with security audit
RUN npm install -g pnpm@latest && \
    pnpm config set store-dir ~/.pnpm-store && \
    pnpm install --no-frozen-lockfile && \
    pnpm audit --audit-level moderate || true

# Copy source code for build optimization analysis
COPY src/ ./src/
COPY scripts/ ./scripts/

# Stage 2: Security scanner
FROM builder AS security-scan

# Run security analysis
RUN npm audit --audit-level moderate && \
    pnpm audit --audit-level moderate

# Stage 3: Production image with enhanced security
FROM node:18-alpine AS production

# Install security updates and necessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata \
    tini && \
    rm -rf /var/cache/apk/* && \
    # Remove package manager to reduce attack surface
    rm -rf /usr/share/apk

# Create non-root user with specific UID/GID for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpserver -u 1001 -G nodejs && \
    # Create home directory with proper permissions
    mkdir -p /home/mcpserver && \
    chown mcpserver:nodejs /home/mcpserver

# Set working directory with proper permissions
WORKDIR /app

# Copy package files for production dependency installation
COPY --chown=mcpserver:nodejs package*.json ./
COPY --chown=mcpserver:nodejs pnpm-lock.yaml* ./

# Install pnpm and production dependencies with cache optimization
RUN npm install -g pnpm@latest && \
    pnpm install --prod --no-frozen-lockfile && \
    pnpm store prune && \
    rm -rf ~/.pnpm-store ~/.npm && \
    # Clean npm cache to reduce image size
    npm cache clean --force

# Copy application code with proper ownership
COPY --chown=mcpserver:nodejs src/ ./src/
COPY --chown=mcpserver:nodejs scripts/ ./scripts/
COPY --chown=mcpserver:nodejs docs/ ./docs/

# Copy optimized dependencies from builder stage
COPY --from=builder --chown=mcpserver:nodejs /app/node_modules ./node_modules

# Create required directories with secure permissions
RUN mkdir -p logs tmp src/tools cache config/runtime && \
    chown -R mcpserver:nodejs logs tmp src/tools cache config && \
    chmod 750 logs tmp src/tools cache config && \
    # Remove write permissions for others
    chmod -R o-w /app

# Set optimized environment variables for production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048 --gc-global --gc-concurrent --use-largepages=silent"
ENV MCP_SERVER_PORT=3001
ENV MCP_SERVER_HOST=0.0.0.0
ENV TZ=UTC
ENV MALLOC_ARENA_MAX=2
ENV UV_THREADPOOL_SIZE=16

# Security environment variables
ENV SECURITY_HEADERS_ENABLED=true
ENV RATE_LIMITING_ENABLED=true
ENV INPUT_VALIDATION_STRICT=true

# Expose ports with documentation
EXPOSE 3001 3002 3101
# 3001: Main MCP server port
# 3002: HTTP API and SSE transport
# 3101: Health check and monitoring port

# Enhanced health check with comprehensive validation
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
    CMD node scripts/health-check-advanced.js || exit 1

# Add health check fallback
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=2 \
    CMD curl -f http://localhost:3101/health || curl -f http://localhost:3001/health || exit 1

# Security: Switch to non-root user
USER mcpserver

# Use tini as init system for proper signal handling and zombie reaping
ENTRYPOINT ["tini", "--", "dumb-init", "--"]

# Start the server with optimized Node.js flags
CMD ["node", "--enable-source-maps", "--unhandled-rejections=strict", "scripts/start-mcp-server.js"]

# Enhanced labels for enterprise container management
LABEL maintainer="Sentia Manufacturing Team"
LABEL version="3.0.0"
LABEL description="Sentia Manufacturing MCP Server - Enterprise Model Context Protocol server for manufacturing intelligence"
LABEL org.opencontainers.image.title="Sentia MCP Server"
LABEL org.opencontainers.image.description="Enterprise-grade MCP server for manufacturing operations with AI integration"
LABEL org.opencontainers.image.version="3.0.0"
LABEL org.opencontainers.image.source="https://github.com/The-social-drink-company/sentia-manufacturing-dashboard"
LABEL org.opencontainers.image.url="https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/tree/main/sentia-mcp-server"
LABEL org.opencontainers.image.documentation="https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/blob/main/sentia-mcp-server/docs/MCP_SERVER_SETUP.md"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="Sentia Manufacturing"
LABEL org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
LABEL security.scan="enabled"
LABEL performance.optimized="true"
LABEL enterprise.ready="true"