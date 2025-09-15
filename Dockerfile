# Simple working Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy everything and build
COPY . .
RUN npm run build

# Start the simple server
CMD ["node", "server-simple.js"]