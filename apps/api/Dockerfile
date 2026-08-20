# syntax=docker/dockerfile:1

# ---------- Builder stage: full devDependencies, compiles TypeScript ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first, separately from source copy — Docker caches this
# layer, so `docker build` only re-runs npm ci when package*.json actually
# changes, not on every source edit.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Production stage: lean, no devDependencies, no source ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Whole dist/ tree, not just dist/src — dist/migrations is also needed here,
# since migration:run:prod reads compiled .js migrations from this same image
# (see typeorm.config.ts's migrations glob).
COPY --from=builder /app/dist ./dist

# File uploads (documents, lecture videos, etc.) write to ./uploads relative
# to the working directory. Container-local storage is a known limitation —
# doesn't survive redeploys or work across multiple replicas — flagged as a
# real item for later (object storage), not solved here.
RUN mkdir -p uploads

# Never run as root in a container — principle of least privilege applies to
# containers the same as it does to database roles (see Day 2).
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main"]
