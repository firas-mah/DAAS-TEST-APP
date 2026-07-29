# ----------------------------------------------------------------------
# Stage 1 -- dependency installation (npm is needed here)
# ----------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ----------------------------------------------------------------------
# Stage 2 -- production runtime (npm / npx / tar removed)
# ----------------------------------------------------------------------
FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production dependencies from the deps stage
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

# ----------------------------------------------------------------------
# Remove npm, npx, and all their bundled modules (including vulnerable
# tar < 7.5.19) from the runtime image.  They are not needed at runtime.
# ----------------------------------------------------------------------
RUN rm -rf \
    /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /root/.npm \
    && rm -rf /tmp/*

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:8080/health || exit 1

CMD ["node", "src/index.js"]
