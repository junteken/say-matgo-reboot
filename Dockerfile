# @MX:NOTE: Use Node.js 18+ for WebSocket server compatibility with ES2020 modules
FROM node:18-alpine

# @MX:NOTE: Set working directory for Railway deployment
WORKDIR /app

# @MX:NOTE: Copy package files first for better Docker layer caching
COPY package*.json ./

# @MX:NOTE: Install dependencies with npm ci for production reliability
RUN npm ci

# @MX:NOTE: Copy source code
COPY . .

# @MX:NOTE: Build TypeScript to JavaScript
RUN npm run build

# @MX:NOTE: Railway provides PORT environment variable dynamically
ENV PORT=8080
ENV NODE_ENV=production

# @MX:NOTE: Expose the port for WebSocket connections
EXPOSE ${PORT}

# @MX:NOTE: Start WebSocket server
CMD ["npm", "start"]
