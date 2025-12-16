FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
RUN corepack enable && pnpm fetch

FROM base AS build
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN echo "Building web with VITE_API_URL=${VITE_API_URL}" \
 && corepack enable \
 && pnpm -C apps/web install --no-frozen-lockfile \
 && pnpm -C apps/web build

FROM nginx:alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


