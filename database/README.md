# Database

Database files for LendLoop.

## What It Does

The database stores:

- Users
- Items
- Locations
- Loans
- Loan statuses
- Item conditions
- Damage policies
- Locker/location data used by DSL matching

## Main Tech

- PostgreSQL
- PostGIS
- Docker

PostGIS is used for geographic queries like nearby and closest items/locations.

## Files

```text
schema.sql      Main database schema
seed.sql        Seed/demo data
schema_old.sql  Old schema backup/reference
```

## How It Is Loaded

Docker Compose mounts these files into the Postgres container:

```text
database/schema.sql
database/seed.sql
```

On first database startup, Postgres runs them automatically.

## Start Database

From project root:

```bash
docker compose up -d db
```

This starts only the database container.

## Start Full App

For the production-style stack:

```bash
docker compose -f docker-compose.server.yml up -d
```

This starts:

- database
- backend
- frontend

## Reset Database

This deletes all local database data:

```bash
docker compose -f docker-compose.server.yml down -v
```

Then recreate it:

```bash
docker compose -f docker-compose.server.yml up -d
```

Use this when you want the database to reload from:

```text
schema.sql
seed.sql
```

## Check Database Container

```bash
docker ps
```

Expected database container:

```text
lendloop-db
```

Check logs:

```bash
docker logs lendloop-db --tail 100
```

## Connection Info

Default values:

```text
Database: lendloop
User: postgres
Password: postgres
Port: 5432
```

Local connection URL:

```text
jdbc:postgresql://localhost:5432/lendloop
```

Docker network connection URL:

```text
jdbc:postgresql://db:5432/lendloop
```

## Important Note

Do not expose PostgreSQL port `5432` publicly on a production server unless it is protected by firewall rules.

The backend should usually be the only service that connects directly to the database!
