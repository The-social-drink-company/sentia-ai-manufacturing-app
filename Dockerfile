# Railway-optimized Node.js full-stack build
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build React frontend
RUN npm run build

# Create necessary directories
RUN mkdir -p logs uploads temp

# Remove devDependencies after build to optimize size
RUN npm prune --production

# Set environment to production
ENV NODE_ENV=production

# Expose port (Railway will set PORT env variable)
EXPOSE ${PORT}

# Health check with Railway-compatible timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Start the Node.js application
CMD ["npm", "start"]