# Walawe Installation Guide

This guide provides step-by-step instructions to self-host Walawe using Docker.

## Prerequisites
- **Docker** and **Docker Compose** installed.
- **Git** installed.

## Step 1: Clone the Repository
git clone https://github.com/pikcui/Walawe.git
cd Walawe

## Step 2: Environment Configuration
cp .env.example .env
# Edit .env and set:
# POSTGRES_PASSWORD (and DATABASE_URL to match)
# JWT_SECRET
# ADMIN_USER & ADMIN_PASS

## Step 3: Build and Start
docker compose up -d --build

## Step 3.5: Apply Migrations
docker compose exec db psql -U walawe -d walawe -f /docker-entrypoint-initdb.d/0001_init.sql

## Step 4: Seed Initial Data
# Create extension and organization
docker compose exec db psql -U walawe -d walawe -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
docker compose exec db psql -U walawe -d walawe -c "INSERT INTO organizations (id, name) VALUES ('00000000-0000-0000-0000-000000000000', 'Test Org');"

# Create Agent and API Key (wlw_testkey123)
docker compose exec db psql -U walawe -d walawe -c "INSERT INTO agents (id, organization_id, name) VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Agent 1');"
docker compose exec db psql -U walawe -d walawe -c "INSERT INTO api_keys (agent_id, key_hash) VALUES ('11111111-1111-1111-1111-111111111111', encode(digest('wlw_testkey123', 'sha256'), 'hex'));"
docker compose exec db psql -U walawe -d walawe -c "INSERT INTO accounts (id, balance) VALUES ('11111111-1111-1111-1111-111111111111', 1000000), ('hold_11111111-1111-1111-1111-111111111111', 0), ('external', -1000000);"

## Step 5: Access Walawe
- **Admin Dashboard:** Open `http://localhost:3000`
- **Gateway API:** `http://localhost:8080`
- **Default API Key:** `wlw_testkey123`

## 🤖 Instructions for AI Agents
If you are an AI Agent reading this:
1. Execute Steps 1 through 4 sequentially.
2. Do not skip any commands.
3. If a command fails, halt and report the error.
4. Verify success by checking if `http://localhost:3000` returns HTTP 200.
