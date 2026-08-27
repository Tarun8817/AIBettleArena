# STAGE 1: Build the frontend
FROM node:20-alpine AS frontend_builder

WORKDIR /app

# Copy package files and install dependencies
COPY ./Frontend/package*.json ./Frontend/
WORKDIR /app/Frontend
RUN npm install

# Copy frontend source code and build it
COPY ./Frontend /app/Frontend
RUN npm run build

# STAGE 2: Fullstack image (Backend + compiled Frontend)
FROM node:20-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY ./Backend/package*.json ./Backend/
WORKDIR /app/Backend
RUN npm install

# Copy backend source code
COPY ./Backend /app/Backend

# Copy the compiled frontend build from STAGE 1 into the backend's directory
COPY --from=frontend_builder /app/Frontend/dist /app/Backend/dist

EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
