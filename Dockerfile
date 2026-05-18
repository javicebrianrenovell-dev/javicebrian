# Multistage build para servir el sitio Astro estático con nginx Alpine.
# Pensado para deploy en Dokploy (mismo VPS que el CRM Imedes).

# --- Stage 1: build Astro ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# --- Stage 2: nginx con dist/ y redirects 301 ---
FROM nginx:1.27-alpine AS runner

COPY infra/nginx-container.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
