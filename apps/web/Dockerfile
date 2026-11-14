FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/sdk/package.json packages/sdk/
COPY packages/mcp/package.json packages/mcp/
COPY apps/web/package.json apps/web/
RUN pnpm install

COPY packages packages
COPY apps/web apps/web
WORKDIR /app/apps/web
RUN pnpm build

FROM node:22-alpine
RUN corepack enable
WORKDIR /app/apps/web
COPY --from=build /app .
EXPOSE 3000
CMD ["pnpm", "start"]
