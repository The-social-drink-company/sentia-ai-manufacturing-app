# Single stage Node.js build for full-stack application
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Build React frontend
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Set environment to production
ENV NODE_ENV=production

# Expose port (Railway will set PORT env variable)
EXPOSE ${PORT:-5000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Start the application
CMD ["node", "server.js"]