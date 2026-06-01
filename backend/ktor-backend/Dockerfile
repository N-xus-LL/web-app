FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .

RUN chmod +x gradlew

ENV GRADLE_OPTS="-Dhttps.protocols=TLSv1.2,TLSv1.3"

# RUN ./gradlew :server:build --no-daemon
RUN ./gradlew :server:build -x test --no-daemon

EXPOSE 8080

CMD ["./gradlew", "run"]