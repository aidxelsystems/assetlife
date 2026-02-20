# Base image
FROM node:20-slim

# Working directory
WORKDIR /app

# Install dependencies first (for caching)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy app source
COPY . .

# Environment setup
ENV NODE_ENV=production
EXPOSE 3000

# Start command
CMD ["node", "server/app.js"]
