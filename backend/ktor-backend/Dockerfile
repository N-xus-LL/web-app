FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

COPY . .

RUN chmod +x gradlew

ENV GRADLE_OPTS="-Dhttps.protocols=TLSv1.2,TLSv1.3"

RUN ./gradlew :server:shadowJar -x test --no-daemon

FROM eclipse-temurin:25-jre

WORKDIR /app

COPY --from=build /app/server/build/libs/server-all.jar /app/server.jar

EXPOSE 8080

CMD ["java", "-jar", "/app/server.jar"]
