# Railway Docker deployment for Sentia Manufacturing Dashboard
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean install
RUN npm ci --only=production --ignore-scripts

# Copy application code
COPY . .

# Create dist directory and build if needed
RUN npm run build 2>/dev/null || echo "No build step required"

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "server.js"]