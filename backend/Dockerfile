FROM dhi.io/gradle:9.4.1-r1-jdk21-alpine3.23-dev AS build
WORKDIR /app
COPY . .
RUN gradle bootJar --no-daemon -Prelease

FROM dhi.io/eclipse-temurin:21-alpine3.22
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}
ENTRYPOINT ["java", "-jar", "app.jar"]
