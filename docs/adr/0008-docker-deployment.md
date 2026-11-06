# 0008. Docker and Docker Compose for Self-Hosting

- Status: Accepted
- Date: 2026-11-06

## Context
Users must be able to self-host Walawe easily on any cloud provider (VPS, AWS, etc.) without installing Go, Node.js, or PostgreSQL manually. We need a standardized deployment method.

## Decision
1. We will use Docker to containerize both the Gateway (Go) and the Dashboard (Next.js).
2. We will use `docker-compose.yml` to orchestrate the entire stack (PostgreSQL, Gateway, and Web).
3. The Gateway will read the database connection string from the `DATABASE_URL` environment variable, falling back to localhost for local development.
4. The Next.js app will use `output: 'standalone'` to minimize the production image size.
5. Database migrations will be automatically executed by PostgreSQL on the first container startup using the `/docker-entrypoint-initdb.d` volume.

## Consequences
- Users only need Docker and Docker Compose installed to run the full Walawe stack.
- Building the images requires a robust internet connection for downloading base images and dependencies.
