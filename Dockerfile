# Dockerfile for alpr-backend (NestJS/Node.js)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Cài netcat để hỗ trợ lệnh nc cho wait-for-postgres.sh
RUN apk add --no-cache netcat-openbsd

# Copy source code
COPY . .

# Expose port (same as in .env and docker-compose)
EXPOSE 5555

# Build app trước khi start production
RUN npm run build

# Copy script chờ database
COPY wait-for-postgres.sh ./
RUN chmod +x wait-for-postgres.sh

# Start app chỉ khi DB đã sẵn sàng
CMD ["./wait-for-postgres.sh", "db", "npm", "run", "start:prod"]
