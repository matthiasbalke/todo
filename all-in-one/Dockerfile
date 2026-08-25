# Stage 1: build backend
# https://hub.docker.com/hardened-images/catalog/dhi/gradle/images
FROM dhi.io/gradle:9.7.1-r0-jdk21-alpine3.24-dev AS backend-build
WORKDIR /app
COPY backend/ .

RUN --mount=type=cache,id=gradle,target=/root/.gradle \
    gradle bootJar --no-daemon -Prelease
RUN mkdir -p build/dependency && (cd build/dependency; jar -xf ../libs/*.jar)


# Stage 2: build frontend
FROM dhi.io/bun:1.3.14-alpine3.22-dev AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/bun.lockb ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Stage 3: runtime
FROM dhi.io/eclipse-temurin:21.0.12.8-alpine3.23-dev

# renovate: datasource=repology depName=nodejs packageName=alpine_3_23/nodejs versioning=loose
ARG NODEJS_VERSION="24.18.1-r0"

# renovate: datasource=repology depName=nginx packageName=alpine_3_23/nginx versioning=loose
ARG NGINX_VERSION="1.29.8-r0"

# renovate: datasource=repology depName=supervisor packageName=alpine_3_23/supervisor versioning=loose
ARG SUPERVISOR_VERSION="4.3.0-r0"

RUN apk add --no-cache \
    nodejs="${NODEJS_VERSION}" \
    nginx="${NGINX_VERSION}" \
    supervisor="${SUPERVISOR_VERSION}"

WORKDIR /app

# copy extracted for better caching support
# https://spring.io/guides/gs/spring-boot-docker
ARG DEPENDENCY=/app/build/dependency
COPY --from=backend-build ${DEPENDENCY}/BOOT-INF/lib ./backend/lib
COPY --from=backend-build ${DEPENDENCY}/META-INF ./backend/META-INF
COPY --from=backend-build ${DEPENDENCY}/BOOT-INF/classes ./backend

COPY --from=frontend-build /app/build ./frontend/build
COPY --from=frontend-build /app/node_modules ./frontend/node_modules

COPY all-in-one/nginx.conf /etc/nginx/nginx.conf
COPY all-in-one/supervisord.conf /etc/supervisord.conf

RUN chown -R 65532:65532 /app

ENV NODE_ENV="production"
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}

EXPOSE 80
# user: nonroot 65532
# user: nobody  65534
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
