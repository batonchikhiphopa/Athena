# syntax=docker/dockerfile:1

FROM node:24-bookworm AS deps
WORKDIR /app

ENV npm_config_loglevel=verbose
ENV npm_config_fund=false
ENV npm_config_audit=false
ENV npm_config_fetch_retries=2
ENV npm_config_fetch_retry_maxtimeout=30000

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ pkg-config \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json

RUN npm ci --foreground-scripts --no-audit --no-fund
RUN npm rebuild sqlite3 --build-from-source

FROM deps AS build
WORKDIR /app

COPY tsconfig*.json ./
COPY server ./server
COPY shared ./shared
COPY client ./client

RUN npm run build
RUN npm prune --omit=dev --workspaces --no-audit --no-fund

FROM node:24-bookworm AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV ATHENA_HOST=0.0.0.0
ENV PORT=3000
ENV ATHENA_PROJECT_ROOT=/app
ENV ATHENA_CLIENT_DIST_DIR=/app/client/dist
ENV ATHENA_DATA_DIR=/app/data

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/client/dist ./client/dist
COPY schema.sql ./schema.sql

RUN mkdir -p /app/data

VOLUME ["/app/data"]
EXPOSE 3000

CMD ["npm", "run", "start"]
