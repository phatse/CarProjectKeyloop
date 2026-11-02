# syntax=docker/dockerfile:1

# ---- build ----------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: the `postinstall` hook would run `prisma generate` before
# the schema is copied; we run it explicitly below instead.
RUN npm ci --ignore-scripts

COPY nest-cli.json tsconfig.json tsconfig.build.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src

# The Prisma client is generated from the schema (src/generated is gitignored).
RUN npx prisma generate
RUN npm run build

# ---- runtime --------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# --ignore-scripts: the Prisma client is already compiled into dist/ by the
# build stage, so the `postinstall` generate step is not needed here.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 3000

# Apply pending migrations, then start. `migrate deploy` is a no-op when there
# are none, so this is safe from the very first run.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
