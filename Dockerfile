# Production Dockerfile for Railway Deployment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm ci --legacy-peer-deps

# Copy all application files
COPY . .

# Build the React application
RUN npm run build

# Expose port (Railway will override with PORT env var)
EXPOSE 5000

# Start the production server using railway-ultimate.js which handles PORT correctly
CMD ["node", "railway-ultimate.js"]