# Dockerfile for Render Worker Service
# Playwright-compatible image with Chromium dependencies

FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev

# Install Playwright browsers (Chromium is already included in the base image)
# But we'll ensure it's available
RUN npx playwright install chromium --with-deps || true

# Copy application files selectively to avoid Windows permission issues
COPY index.js ./
COPY utils-new ./utils
COPY processors-new ./processors

# Expose a minimal health check port (optional, for monitoring)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the worker
CMD ["node", "index.js"]