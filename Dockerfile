# ==============================================================
# Google Cloud Run Multi-Stage Production Dockerfile
# ==============================================================

FROM node:20-alpine AS runner

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Create working directory
WORKDIR /app

# Copy package descriptors and source code
COPY package.json ./
COPY server.js ./
COPY src/ ./src/
COPY public/ ./public/

# Ensure data directory exists and set non-root user permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Run as non-root user for security hardening
USER node

# Expose standard Cloud Run port
EXPOSE 8080

# Health check probe for Google Cloud Run container readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the full-stack server
CMD ["node", "server.js"]
