# https://hub.docker.com/hardened-images/catalog/dhi/gradle/images
FROM dhi.io/gradle:9.7.0-r1-jdk21-alpine3.24-dev AS backend-build

WORKDIR /app
COPY . .

RUN --mount=type=cache,id=gradle,target=/root/.gradle \
    gradle bootJar --no-daemon -Prelease
RUN mkdir -p build/dependency && (cd build/dependency; jar -xf ../libs/*.jar)


FROM dhi.io/eclipse-temurin:21.0.12.8-alpine3.23-dev

# user: nonroot 65532
# user: nobody  65534
USER 65532:65532

WORKDIR /app

# copy extracted for better caching support
# https://spring.io/guides/gs/spring-boot-docker
ARG DEPENDENCY=/app/build/dependency
COPY --from=backend-build ${DEPENDENCY}/BOOT-INF/lib /backend/lib
COPY --from=backend-build ${DEPENDENCY}/META-INF /backend/META-INF
COPY --from=backend-build ${DEPENDENCY}/BOOT-INF/classes /backend

ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}

ENTRYPOINT ["java","-cp","/backend:/backend/lib/*","com.github.matthiasbalke.todo.TodoApplicationKt"]
