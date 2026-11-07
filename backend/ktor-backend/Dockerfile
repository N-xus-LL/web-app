# ==========================================
# Build stage
# ==========================================
FROM eclipse-temurin:25-jdk AS build
WORKDIR /home/build

# Copy ONLY the files that declare dependencies first
# These change infrequently, so the dependency-resolution layer
# stays cached across source-code changes
COPY gradlew gradlew
COPY gradle ./gradle
COPY gradle.properties ./
COPY settings.gradle.kts ./
COPY build.gradle.kts ./
COPY server/build.gradle.kts ./server/
COPY core/build.gradle.kts ./core/
COPY client/build.gradle.kts ./client/

# Resolve/download dependencies – cache mount keeps ~/.gradle on the
# builder host so it survives even when this layer is invalidated
RUN chmod +x gradlew
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew :server:dependencies --no-daemon \
    -Dorg.gradle.jvmargs="--enable-native-access=ALL-UNNAMED"

# NOW copy the source code – any .kt/.java change only invalidates
# this layer and the ones after it.
COPY . .

# Build – same cache mount so compiled deps/outputs are reused
RUN chmod +x gradlew
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew :server:shadowJar -x test --no-daemon \
    -Dorg.gradle.jvmargs="--enable-native-access=ALL-UNNAMED"

# ==========================================
# Runtime stage
# ==========================================
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /home/build/server/build/libs/server-all.jar /app/server.jar
EXPOSE 8080
CMD ["java", "-jar", "/app/server.jar"]