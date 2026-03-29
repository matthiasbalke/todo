FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY . .
ARG APP_VERSION=0.1.0-SNAPSHOT
RUN ./gradlew bootJar --no-daemon -Pversion=${APP_VERSION}

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
