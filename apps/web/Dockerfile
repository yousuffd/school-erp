# syntax=docker/dockerfile:1

# ---------- deps stage: install once, cached separately from source ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder stage ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No public/ directory exists yet in this project — Next.js itself doesn't
# require one, but the production stage's COPY step below does (Docker COPY
# fails hard on a missing source path). Guarantees it exists, even if empty,
# so a future addition of real static assets doesn't require touching this
# Dockerfile.
RUN mkdir -p public

# NEXT_PUBLIC_* vars are baked into the client-side bundle at BUILD time, not
# read at container start — must be passed as a build ARG, not just an env
# var on `docker run`. Override for a real deployment:
#   docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.yourschool.com/api/v1
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# ---------- production stage ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

# Standalone output = a self-contained server with only the files actually
# needed to run, not the full node_modules tree.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
