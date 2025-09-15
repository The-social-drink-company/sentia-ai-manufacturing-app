# Production Dockerfile for Railway Deployment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci --legacy-peer-deps

# Copy all application files
COPY . .

# Build the React application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Railway will provide PORT environment variable
ENV PORT=5000

# Expose the port (Railway will override this)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the production server
CMD ["node", "railway-ultimate.js"]