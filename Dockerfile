
# ==============================================================
# ElderCare Connect - Production Dockerfile
# ==============================================================

FROM node:24-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Copy project files from GitHub repository root
COPY . .

# Create database directory and set permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start application
CMD ["node", "server.js"]
