# Stage 1: build backend
FROM dhi.io/gradle:9.5.0-jdk21-alpine3.22-dev AS backend-build

WORKDIR /app
COPY backend/ .

RUN --mount=type=cache,id=gradle,target=/root/.gradle \
    gradle bootJar --no-daemon -Prelease
RUN mkdir -p build/dependency && (cd build/dependency; jar -xf ../libs/*.jar)


# Stage 2: build frontend
FROM dhi.io/bun:1.3.11-alpine3.22-dev AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/bun.lockb ./
RUN bun install --frozen-lockfile
COPY frontend/ .
RUN bun run build

# Stage 3: runtime
FROM dhi.io/eclipse-temurin:21-alpine3.22-dev
RUN apk add --no-cache nodejs=22.22.2-r0 nginx=1.28.3-r0 supervisor=4.2.5-r5

# user: nonroot 65532
# user: nobody  65534
USER 65532:65532

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

ENV NODE_ENV="production"
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}

EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
