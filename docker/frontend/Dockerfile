# ============================================================
# ION DEX Frontend — React Vite SPA
# ============================================================
FROM node:22-slim AS builder

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
RUN npx tsc && npx vite build

# ─── nginx production ───────────────────────────────────────
FROM nginx:alpine

# nginx.conf lives under frontend/ (SPA build context)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/99-wait-for-backend.sh /docker-entrypoint.d/99-wait-for-backend.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/99-wait-for-backend.sh \
    && chmod +x /docker-entrypoint.d/99-wait-for-backend.sh
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
