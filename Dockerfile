# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy only what we need to run
COPY --from=build /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "start"]