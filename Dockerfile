# Dockerfile for alpr-backend (NestJS/Node.js)
# FROM node:20-alpine AS BUILD_STAGE

# # Set working directory
# WORKDIR /app

# # Copy package files and install dependencies
# COPY package*.json ./

# RUN npm install --production

# COPY . .

# CMD ["npm", "run", "build"]

# FROM node:20-alpine as RUN_STAGE

# COPY package*.json ./

# RUN npm install --production

# # Copy source code
# COPY --from=BUILD_STAGE /app/dist ./dist

# # Expose port (same as in .env and docker-compose)
# EXPOSE 5555

# # Start app chỉ khi DB đã sẵn sàng
# CMD ["node", "dist/main"]


# DEV STAGE
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# RUN addgroup -S app && adduser -S app -G app
# USER app

COPY . .

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "executable" ]

CMD ["npm", "run", "start:dev"]