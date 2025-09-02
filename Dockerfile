# Multi-stage build for React/Vite frontend
FROM node:18-alpine AS node-builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Python runtime stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built React application from node stage
COPY --from=node-builder /app/dist ./dist

# Copy Python application files
COPY app/ ./app/
COPY run.py .
COPY config.py .
COPY migrations/ ./migrations/

# Create necessary directories
RUN mkdir -p instance uploads temp_uploads

# Set environment variables
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Expose port (Railway will override this if needed)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=10)" || exit 1

# Run the application with Gunicorn for production
CMD gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 4 --worker-class gevent --timeout 120 run:app