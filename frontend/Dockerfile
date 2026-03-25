FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build/index.js"]
