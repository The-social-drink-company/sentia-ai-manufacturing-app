# Use Node.js 22 Alpine for smaller image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to handle React 19 conflict
RUN npm ci --legacy-peer-deps

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Expose port (Railway will override this)
EXPOSE 3000

# Start the application
CMD ["node", "railway-ultimate.js"]