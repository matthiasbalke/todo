FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
ARG APP_VERSION=0.1.0
RUN ./gradlew bootJar --no-daemon -Prelease

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ARG BUILD_NUMBER=0
ENV APP_BUILD_NUMBER=${BUILD_NUMBER}
ENTRYPOINT ["java", "-jar", "app.jar"]
