FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (Prisma CLI is needed for migrations)
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY src ./src

# Copy scripts (if needed)
COPY scripts ./scripts

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run database migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

