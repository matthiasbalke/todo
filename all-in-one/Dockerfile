# Stage 1: build backend
# https://hub.docker.com/hardened-images/catalog/dhi/gradle/images
FROM dhi.io/gradle:9.5.1-r3-jdk21-alpine3.23-dev AS backend-build
WORKDIR /app
COPY backend/ .
RUN gradle bootJar --no-daemon -Prelease

# Stage 2: build frontend
FROM dhi.io/bun:1.3-alpine3.22-dev AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/bun.lockb ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Stage 3: runtime
FROM dhi.io/eclipse-temurin:21-alpine3.23-dev
RUN apk add --no-cache nodejs=24.14.1-r0 nginx=1.29.8-r0 supervisor=4.3.0-r0
WORKDIR /app
COPY --from=backend-build /app/build/libs/*.jar backend.jar
COPY --from=frontend-build /app/build ./frontend/build
COPY --from=frontend-build /app/node_modules ./frontend/node_modules
COPY all-in-one/nginx.conf /etc/nginx/nginx.conf
COPY all-in-one/supervisord.conf /etc/supervisord.conf

ENV NODE_ENV="production"
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}

EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
