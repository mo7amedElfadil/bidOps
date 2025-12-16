FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
RUN corepack enable && pnpm fetch

FROM base AS build
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY . .
RUN cd apps/api \
 && npm install --legacy-peer-deps --ignore-scripts \
 && npx prisma generate \
 && npx tsc -p tsconfig.build.json \
 && npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
## copy runtime deps and built artifacts
COPY --from=build /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./
CMD ["node", "dist/main.js"]


