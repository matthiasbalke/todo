# Stage 1: build backend
FROM gradle:8-jdk21 AS backend-build
WORKDIR /app
COPY backend/ .
RUN ./gradlew bootJar --no-daemon

# Stage 2: build frontend
FROM oven/bun:1 AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/bun.lockb ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Stage 3: runtime
FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache nodejs nginx supervisor
WORKDIR /app
COPY --from=backend-build /app/build/libs/*.jar backend.jar
COPY --from=frontend-build /app/build ./frontend/build
COPY --from=frontend-build /app/node_modules ./frontend/node_modules
COPY all-in-one/nginx.conf /etc/nginx/nginx.conf
COPY all-in-one/supervisord.conf /etc/supervisord.conf

ENV NODE_ENV "production"

EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
