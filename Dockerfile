# Use Node.js 20 official image
FROM node:20-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better Docker caching
COPY package*.json ./
COPY prisma ./prisma/

# Clear any cache and install dependencies to fix rollup issues
RUN npm cache clean --force && npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the React frontend with dependency fix
RUN npm rebuild && npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start command - run migrations first, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]