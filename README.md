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

From the project root, build local images and start frontend, backend, and database together:

```bash
docker compose up -d --build
```


Open:

```text
http://localhost
```

Backend is also available at `http://localhost:8080`. Images are tagged
`lendloop-backend:local` and `lendloop-frontend:local`; this command does not
push anything to Docker Hub. Docker downloads base images/dependencies on the
first build. Later starts can use `docker compose up -d` without rebuilding.

After changing code, rebuild the relevant service:

```bash
docker compose up -d --build frontend
docker compose up -d --build backend
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
docker compose down
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

## Publish Local Images And Update The Server

Run these commands on your PC from the project root:

```bash
docker compose build backend frontend
docker login
docker tag lendloop-backend:local n3xusll/lendloop-backend:latest
docker tag lendloop-frontend:local n3xusll/lendloop-frontend:latest
docker push n3xusll/lendloop-backend:latest
docker push n3xusll/lendloop-frontend:latest
```

- `build` creates both images from the current source on your PC.
- `login` authenticates your Docker Hub account.
- `tag` gives the local images the repository names used by the server.
- `push` uploads the images to Docker Hub. You need permission to push to the `n3xusll` repositories.

Commit and push source/config changes to Git separately. Docker image uploads do not update Git.

On the server, run from the cloned project root:

```bash
git pull --ff-only
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
docker compose -f docker-compose.server.yml ps
curl --fail http://localhost/health
```

- `git pull --ff-only` updates the repository, including Compose and database scripts.
- Compose `pull` downloads the published images.
- `up -d` starts or recreates the containers using those images in the background.
- `ps` shows container status.
- `curl` checks the backend through the frontend proxy; expect `{"status":"ok"}`.

Open `http://SERVER_IP` to use the app. The repository's server file is named
`docker-compose.server.yml`. If you named it `server.yaml` on your server,
replace `-f docker-compose.server.yml` with `-f server.yaml` in these commands.

The server does not need Node.js, Java, or Gradle installed on the host and does
not compile the application. Database data stays in its Docker volume during
updates; SQL initialization scripts only run when that volume is first created.

