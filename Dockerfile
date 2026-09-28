# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM node:24-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN if grep -rlI '^version https://git-lfs.github.com/spec' apps/client/public; then \
        echo 'Git LFS pointers found above: run `git lfs pull` before building.' >&2; exit 1; \
    fi
RUN pnpm -r run build

FROM node:24-slim AS deps
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod --filter '@slur/server...'

FROM node:24-slim
ENV NODE_ENV=production \
    PORT=2567 \
    HOST=0.0.0.0 \
    SLUR_TRACK_GEN=phrase \
    SLUR_CLIENT_DIR=/app/client
WORKDIR /app
COPY --from=deps /app ./
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/client/build/client client
USER node
EXPOSE 2567
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD ["node", "-e", "fetch('http://127.0.0.1:2567/healthz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "apps/server/dist/index.js"]
