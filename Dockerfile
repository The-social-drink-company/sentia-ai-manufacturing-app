# Simple working Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy everything and build
COPY . .
RUN npm run build

# Start the simple server with ES modules
CMD ["node", "server-simple.mjs"]