# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install --workspace=frontend

# Copy frontend source
COPY frontend/ ./frontend/

# Build Next.js
WORKDIR /app/frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
