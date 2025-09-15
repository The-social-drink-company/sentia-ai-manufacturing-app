# Simple working Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy everything and build
COPY . .
RUN npm run build

# Start the railway-ultimate server that handles PORT correctly
CMD ["node", "railway-ultimate.js"]