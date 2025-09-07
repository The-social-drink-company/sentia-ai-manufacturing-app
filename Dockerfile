FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy Prisma schema first
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy rest of source code
COPY . .

# Build the application
RUN npm run build

# After build - verify dist directory structure
RUN ls -la dist/
RUN ls -la dist/assets/ || echo "No assets directory"
RUN ls -la public/ || echo "No public directory"

# Railway auto-assigns port via PORT environment variable
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]