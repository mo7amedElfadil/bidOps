FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/workers/package.json apps/workers/package.json
RUN corepack enable && pnpm fetch

FROM base AS build
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY . .
RUN corepack enable && pnpm -C apps/workers install --offline && pnpm -C apps/workers build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/workers/dist ./dist
COPY apps/workers/package.json ./
CMD ["node", "dist/index.js"]


