# DaaS Test App

A full-stack Notes application designed to validate a DaaS (Deployment as a Service) platform.

## Architecture

```
daas-test-app/
├── backend/       → Node.js 20 + Express + pg (PostgreSQL client)
├── frontend/      → React + Vite + Nginx
└── docker-compose.yml → Local test environment
```

## Functional Features

- Create, list, edit, and delete notes
- Backend connection status (live)
- Database connection status (live)
- Persistent PostgreSQL storage
- Graceful shutdown

## DaaS Platform Deployment

This application is designed to be deployed as **two separate components** on a DaaS platform that builds Docker images from source, deploys them to Kubernetes, and attaches a managed PostgreSQL database.

### Backend Component

| Field              | Value                                       |
|--------------------|---------------------------------------------|
| Component name     | `backend`                                   |
| Context directory  | `backend`                                   |
| Dockerfile path    | `Dockerfile`                                |
| Container port     | `8080`                                      |
| Service port       | `8080`                                      |
| Readiness probe    | `GET /ready`                                |
| Liveness probe     | `GET /health`                               |

**Required environment variables:**

| Variable         | Description                                                   |
|------------------|---------------------------------------------------------------|
| `PORT`           | Container port (default: `8080`)                              |
| `DATABASE_URL`   | PostgreSQL connection URL (alternative to individual vars)    |
| `DB_HOST`        | PostgreSQL hostname                                           |
| `DB_PORT`        | PostgreSQL port (default: `5432`)                             |
| `DB_NAME`        | PostgreSQL database name                                      |
| `DB_USER`        | PostgreSQL username                                           |
| `DB_PASSWORD`    | PostgreSQL password                                           |
| `FRONTEND_URL`   | Public frontend URL (used for CORS, e.g., `https://app.example.com`) |

### Frontend Component

| Field              | Value                                       |
|--------------------|---------------------------------------------|
| Component name     | `frontend`                                  |
| Context directory  | `frontend`                                  |
| Dockerfile path    | `Dockerfile`                                |
| Container port     | `8080`                                      |
| Service port       | `8080`                                      |
| Readiness probe    | `GET /health`                               |
| Liveness probe     | `GET /health`                               |

**Required environment variables:**

| Variable       | Description                                                |
|----------------|------------------------------------------------------------|
| `BACKEND_URL`  | Public backend URL (must be browser-accessible, e.g., `https://api.example.com`) |

### Important Deployment Notes

1. **PostgreSQL must be attached as a managed database** to the backend component. The exact environment variable names depend on what your platform injects. Adjust `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, or `DATABASE_URL` accordingly.

2. **`FRONTEND_URL`** (backend) must contain the public frontend URL (e.g., `https://app.example.com`). This is used for CORS.

3. **`BACKEND_URL`** (frontend) must contain the public backend URL (e.g., `https://api.example.com`). The browser needs this URL to make API calls. A Kubernetes Service DNS name (e.g., `http://backend:8080`) will **not** work from the browser.

4. Both public URLs must use **HTTPS** in production.

5. The frontend obtains its backend URL at **container runtime** via `docker-entrypoint.sh`, which generates `/usr/share/nginx/html/runtime-config.js`. No secrets are exposed in this file.

6. The frontend and backend are **independently deployable**. Each has its own Dockerfile and can be built separately.

## Persistence Test

Use the following procedure to verify that data persists across restarts:

1. **Create a note:** Use the frontend UI to create a note with a unique title.
2. **Record its ID:** Note the ID displayed in the note metadata.
3. **Restart or redeploy the backend:** Simulate a pod restart or redeployment on the platform.
4. **Reload the frontend:** Refresh the browser page.
5. **Confirm persistence:** The note should still appear in the list with the same ID, title, content, and creation timestamp.

## Local Development

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for full-stack test)

### Quick Start (without Docker)

```bash
# 1. Start PostgreSQL (e.g., via Docker)
docker run -d --name daas-test-pg \
  -e POSTGRES_DB=daas_test_app \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Start backend
cd backend
cp .env.example .env
npm install
npm start

# 3. Start frontend (in another terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173` (Vite dev server).

### Full-Stack Test with Docker Compose

```bash
cd daas-test-app
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

### API Endpoints (for manual testing)

```bash
# Health
curl http://localhost:8080/health

# Readiness
curl http://localhost:8080/ready

# Status
curl http://localhost:8080/api/status

# List notes
curl http://localhost:8080/api/notes

# Create a note
curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","content":"World"}'

# Update a note
curl -X PUT http://localhost:8080/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated","content":"Content"}'

# Delete a note
curl -X DELETE http://localhost:8080/api/notes/1
```

## API Smoke Test

```bash
# Quick validation script
echo "=== Health Check ==="
curl -s http://localhost:8080/health | jq .

echo "=== Readiness Check ==="
curl -s http://localhost:8080/ready | jq .

echo "=== Status ==="
curl -s http://localhost:8080/api/status | jq .

echo "=== Create Note ==="
curl -s -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note","content":"Testing persistence"}' | jq .

echo "=== List Notes ==="
curl -s http://localhost:8080/api/notes | jq .

echo "=== Update Note ==="
curl -s -X PUT http://localhost:8080/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Note","content":"Updated content"}' | jq .

echo "=== Delete Note ==="
curl -s -X DELETE http://localhost:8080/api/notes/1 | jq .
```

## License

This project is for testing purposes only.

# DAAS-TEST-APP
