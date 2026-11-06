FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

COPY backend ./backend
RUN pnpm --filter @lunch-tracker/backend db:generate
RUN pnpm --filter @lunch-tracker/backend build

FROM base AS runner
WORKDIR /app/backend
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend/package.json ./package.json
COPY --from=build --chown=node:node /app/backend/prisma ./prisma
COPY --from=build --chown=node:node /app/backend/dist ./dist

USER node

EXPOSE 3333
CMD ["node", "dist/server.js"]
