# Custom Dockerfile to override Nixpacks auto-detection
FROM node:23-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the application (without problematic cache removal)
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]