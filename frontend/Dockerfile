FROM oven/bun:1 AS build

ARG APP_VERSION=0.0.0

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
ENV NODE_ENV=production
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}
CMD ["node", "build/index.js"]
