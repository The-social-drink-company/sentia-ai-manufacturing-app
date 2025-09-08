# Use Node.js 20 official image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies without cache
RUN npm ci --no-cache --production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "server.js"]