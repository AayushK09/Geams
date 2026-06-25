# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY backend/package.json ./backend/

# Install dependencies
RUN npm install --workspace=backend --production

# Copy backend source
COPY backend/ ./backend/

# Build NestJS
WORKDIR /app/backend
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "prod"]
