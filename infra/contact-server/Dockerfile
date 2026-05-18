# Microservicio de contacto: Express + Resend.
# Variables que necesita en runtime (Dokploy env vars):
#   RESEND_API_KEY     — API key de Resend
#   RESEND_FROM        — dirección verificada en Resend
#   RESEND_TO          — destino del lead
#   TURNSTILE_SECRET   — Cloudflare Turnstile secret (si está activo)
#   PORT               — opcional, default 3001

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

USER node

CMD ["node", "server.js"]
