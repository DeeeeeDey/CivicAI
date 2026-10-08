# CivicAI

CivicAI is a smart civic complaint management platform that connects citizens, AI, municipal authorities, and field workers into one end-to-end workflow.

## Foundation Architecture

- **/client**: Frontend application
- **/server**: Node.js/Express backend with PostgreSQL (Prisma)
- **/ai-service**: Python FastAPI AI microservice

## Setup and Run

Ensure Docker Desktop is running.

1. Create a `civicai_db` container using the provided docker-compose:
   ```bash
   docker compose up -d postgres
   ```
2. In the `/server` directory, copy `.env.example` to `.env` (already done).
3. Push the Prisma schema and run migrations:
   ```bash
   cd server
   npx prisma migrate dev --name init
   ```
   *Note: `npx prisma db seed` is automatically run after migrations if configured.*

## Demo Accounts

The following demo accounts are created during seeding. 
**Password for all accounts:** `password123`

- **Citizen**: `citizen@civicai.com`
- **Officer**: `officer@civicai.com` (and `officer1@civicai.com`, `officer2@civicai.com`)
- **Worker**: `worker@civicai.com` (and `worker1@civicai.com` to `worker7@civicai.com`)
- **Admin**: `admin@civicai.com`

## Starting All Services

Once migrations are applied and the DB is seeded, you can start the full stack:
```bash
docker compose up --build
```
