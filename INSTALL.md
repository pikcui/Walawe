# Installation & Integration Guide

This guide covers two main scenarios:
1. **Integration:** How to connect your existing AI Agent to Walawe's Gateway.
2. **Development:** How to run the Walawe source code locally.

---

## Part 1: Using Walawe with your AI Agent

Walawe acts as an API Gateway. You do not need to install Walawe locally to use it. You just need to point your AI Agent's HTTP requests to the Walawe Gateway.

### Prerequisites
1. Register an account at [Walawe Dashboard](https://walawe-amber.vercel.app/register).
2. Save the `wlw_...` **Walawe API Key** provided after registration.
3. Ensure you have an **AI Provider Key** (BYOK) from OpenAI, Gemini, Anthropic, or Groq.

### Integration Example (Python)

Here is how you connect a standard OpenAI client to Walawe instead of directly to OpenAI:

~~~python
from openai import OpenAI

client = OpenAI(
    api_key="wlw_YOUR_WALAWE_API_KEY", # Your Walawe Key
    base_url="https://walawe.hostless.app/v1", # Walawe Gateway URL
    default_headers={
        "X-Provider-Key": "sk-YOUR_OPENAI_KEY", # Your BYOK Key
        "X-Provider-Name": "openai"             # openai, gemini, anthropic, or groq
    }
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
~~~

### Important Headers
Every request to Walawe **must** include these headers:
*   `Authorization: Bearer wlw_...` (Your Walawe API Key)
*   `X-Provider-Key: sk-...` (Your AI Provider Key)
*   `X-Provider-Name: openai` (or `gemini`, `anthropic`, `groq`)

---

## Part 2: Manual Installation (Local Development)

Follow these steps to run Walawe on your local machine (e.g., Termux, Linux, or macOS).

### 1. Prerequisites
Ensure you have the following installed:
*   **Go 1.23.0** (Strictly pinned. Do not upgrade).
*   **Node.js 20+** & **npm**.
*   **PostgreSQL** (We recommend [Neon](https://neon.tech)).
*   **Redis** (We recommend [Upstash](https://upstash.com)).
*   **Foundry** (For Smart Contracts).

### 2. Environment Variables
Copy the example environment file and fill in your details:
~~~bash
cp .env.example .env
~~~

You need to set the following variables in `.env`:
~~~env
# Database (Neon)
DATABASE_URL="postgres://user:password@host:port/dbname?sslmode=require"

# Redis (Upstash) - MUST use rediss:// for TLS
REDIS_URL="rediss://default:password@host:port"

# JWT (For Authentication)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Frontend (Vercel/Local)
NEXT_PUBLIC_API_URL="http://localhost:8080"
~~~

### 3. Database Migrations
Run the SQL migrations to set up your database schema. If you are using Neon, you can paste these directly into the Neon SQL Editor, or use `psql`:

~~~bash
psql $DATABASE_URL -f migrations/000001_init.up.sql
psql $DATABASE_URL -f migrations/000002_x402.up.sql
psql $DATABASE_URL -f migrations/000003_ledger_core.up.sql
# ... run all migration files in order
~~~

### 4. Backend (Go Gateway)
Navigate to the gateway directory, ensure the Go version is correct, and run the server:

~~~bash
cd apps/gateway
go mod tidy
sed -i 's/go 1\..*/go 1.23.0/g' go.mod  # Force Go 1.23.0
go run .
~~~
The API Gateway will start on `http://localhost:8080`. 
You can verify it by visiting `http://localhost:8080/healthz` (should return "ok").

### 5. Frontend (Next.js)
Navigate to the web directory and run the development server:

~~~bash
cd apps/web
npm install
npm run dev
~~~
The frontend will be available at `http://localhost:3000`.

### 6. Smart Contracts (Foundry)
To compile and test the ERC-4337 Smart Contracts:

~~~bash
cd packages/contracts
forge build
forge test
~~~

To deploy to Base Sepolia (requires a private key and RPC URL):
~~~bash
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
~~~

---

## Part 3: Troubleshooting

*   **"Invalid API Key" (401):** Ensure you are using the `wlw_...` key from Walawe for the `Authorization` header, and the `sk-...` key for the `X-Provider-Key` header. Do not mix them up.
*   **Redis Connection Failed:** If you see `connection refused` in the backend logs, ensure your `REDIS_URL` starts with `rediss://` (with an 's' for TLS), not `redis://`.
*   **Go Version Mismatch:** If the backend fails to build, run `go version`. It must be `go1.23.0`. If Termux upgrades it, run `sed -i 's/go 1\..*/go 1.23.0/g' go.mod`.
*   **CORS Errors:** Ensure `NEXT_PUBLIC_API_URL` in the frontend points to the correct backend URL (no trailing slash).
