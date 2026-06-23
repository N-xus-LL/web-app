# LendLoop Web App

LendLoop is a web app for lending and borrowing items between users. It includes a React frontend, a Ktor backend, and a PostgreSQL/PostGIS database.

## Project Parts

- [Frontend](./frontend/README.md) - React app, pages, components, frontend Docker image.
- [Backend](./backend/README.md) - Ktor API, authentication, items, users, loans, DSL.
- [Database](./database/README.md) - PostgreSQL/PostGIS schema and seed data.

## Requirements

Install:

```bash
git
docker
docker compose
```

For frontend development also install:

```bash
node
corepack
```

## Run Full App With Docker

Use this for the production-like setup:

```bash
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

Open:

```text
http://localhost
```

Test:

```bash
curl http://localhost/health
curl http://localhost/items
curl http://localhost/users
curl http://localhost/locations
```

## Run Local Development

Start database and backend:

```bash
docker compose up -d db backend
```

Start frontend:

```bash
cd frontend
corepack enable
corepack pnpm install
corepack pnpm dev
```

Open:

```text
http://localhost:5173
```

## Useful Commands

Stop full app:

```bash
docker compose -f docker-compose.server.yml down
```

Reset database:

```bash
docker compose -f docker-compose.server.yml down -v
docker compose -f docker-compose.server.yml up -d
```

View logs:

```bash
docker logs lendloop-backend --tail 100
docker logs lendloop-frontend --tail 100
docker logs lendloop-db --tail 100
```

## Deployment

The server should pull already-built Docker images instead of building them:

```bash
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

Do not use `--build` on low-RAM servers.

