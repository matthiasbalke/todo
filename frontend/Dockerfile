FROM dhi.io/bun:1.3-alpine3.22-dev AS build
WORKDIR /app
COPY package.json bun.lockb ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM dhi.io/node:24-alpine3.23 AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
EXPOSE 3000
ENV NODE_ENV=production
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}
CMD ["node", "build/index.js"]
