# Backend

Ktor backend for LendLoop.

## What It Does

The backend provides APIs for:

- Users
- Authentication
- Items
- Locations
- Loans
- DSL locker matching
- GeoJSON export

## Main Tech

- Kotlin
- Ktor
- Gradle
- PostgreSQL / PostGIS
- Docker

## Folder Structure

```text
backend/
└── ktor-backend/
    ├── server/        Main backend application
    ├── core/          Shared backend/core module
    ├── Dockerfile     Production backend Docker image
    └── gradlew        Gradle wrapper
```

## Main API Groups

```text
/users
/items
/locations
/api/loans
/api/dsl
/health
```

## Local Development

Start database first:

```bash
docker compose up -d db
```

Run backend locally:

```bash
cd backend/ktor-backend
./gradlew :server:run
```

On Windows PowerShell:

```powershell
cd backend\ktor-backend
.\gradlew.bat :server:run
```

Backend runs on:

```text
http://localhost:8080
```

Health check:

```bash
curl http://localhost:8080/health
```

## Compile Check

```bash
cd backend/ktor-backend
./gradlew :server:compileKotlin
```

On Windows:

```powershell
cd backend\ktor-backend
.\gradlew.bat :server:compileKotlin
```

## Docker Image

Build backend image locally:

```bash
docker build -t n3xusll/lendloop-backend:latest ./backend/ktor-backend
```

Push it:

```bash
docker push n3xusll/lendloop-backend:latest
```

The Docker image builds the backend jar during image build and runs:

```bash
java -jar /app/server.jar
```

The server should pull this image instead of building it on low-RAM machines.

## Database Connection

In Docker Compose, backend connects to the database using:

```text
jdbc:postgresql://db:5432/lendloop
```

For local backend development, it can use:

```text
jdbc:postgresql://localhost:5432/lendloop
```

## Useful Test Requests

```bash
curl http://localhost:8080/health
curl http://localhost:8080/items
curl http://localhost:8080/users
curl http://localhost:8080/locations
```

