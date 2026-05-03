FROM dhi.io/gradle:9.5.0-jdk21-alpine3.22-dev AS build
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=gradle,target=/root/.gradle \
    gradle bootJar --no-daemon -Prelease

FROM dhi.io/eclipse-temurin:21-alpine3.22
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}
ENTRYPOINT ["java", "-jar", "app.jar"]
