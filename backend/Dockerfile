# =============================================================
#  Backend Dockerfile
#  Multi-stage: build TS → run compiled JS
#  Includes OCI CLI to fetch secrets from OCI Vault at startup
# =============================================================

# ---- Stage 1: Build ----
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---- Stage 2: Runtime ----
FROM node:22-slim AS runner

WORKDIR /app

# Install Python + pip + OCI CLI + yt-dlp
RUN apt-get update -y && \
    apt-get install -y python3 python3-pip curl --no-install-recommends && \
    pip3 install oci-cli yt-dlp --break-system-packages && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify installs
RUN yt-dlp --version && oci --version

# Production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Compiled app from builder
COPY --from=builder /app/dist ./dist

# Entrypoint script that fetches secrets from OCI Vault
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 5214

# ✅ entrypoint fetches secrets then starts node
CMD ["./entrypoint.sh"]