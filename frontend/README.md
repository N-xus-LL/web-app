# Frontend

React frontend for LendLoop.

## What It Does

The frontend provides the user interface for:

- Home page
- Login and register
- User profile editing
- Item listing, search, create, edit, and delete
- Loan and lending workflow
- Statistics page
- Interactive map
- DSL meeting point and locker visualization

## Main Tech

- React
- Vite
- React Router
- Leaflet / React Leaflet
- Docker + Nginx for production serving

## Important Folders

```text
src/components   Reusable UI components
src/pages        Main route pages
src/services     API service layer
src/utils        Shared helper functions
src/constants    Shared frontend constants
src/images       App images and map marker assets
public           Static public files like favicon and logo
```

## Local Development

Run backend and database first:

```bash
docker compose up -d db backend
```

Then start the frontend dev server:

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

In dev mode, Vite proxies API requests to the backend on:

```text
http://localhost:8080
```

## Production Build

Build frontend locally:

```bash
corepack pnpm --dir frontend build
```

The output is created in:

```text
frontend/dist
```

## Docker Image

Build the frontend production image:

```bash
docker build -t n3xusll/lendloop-frontend:latest ./frontend
```

Push it:

```bash
docker push n3xusll/lendloop-frontend:latest
```

The production image serves the React app with Nginx.

## Production Routing

Nginx serves the frontend and proxies backend API routes:

```text
/items
/users
/locations
/api
/json
/health
/nominatim
```

This means the app can call backend endpoints using the same server URL.

