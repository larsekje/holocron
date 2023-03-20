FROM node:18.15-alpine
WORKDIR /app

# Install dependencies
COPY frontend/package.json .
RUN npm i

# Copy application
COPY frontend/ ./

# Run
CMD ["npm", "run", "dev"]