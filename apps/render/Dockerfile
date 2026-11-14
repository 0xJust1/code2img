# Playwright's official image ships a matching Chromium + all system deps.
# Keep the tag in sync with the resolved `playwright` version in pnpm-lock.yaml.
FROM mcr.microsoft.com/playwright:v1.65.1-noble

RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/render/package.json apps/render/
RUN pnpm install --frozen-lockfile=false

COPY packages/shared packages/shared
COPY apps/render apps/render

WORKDIR /app/apps/render
ENV NODE_ENV=production
EXPOSE 3002
CMD ["pnpm", "start"]
