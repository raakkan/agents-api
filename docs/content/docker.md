# Docker Setup

The easiest and recommended way to run agent-api is using Docker. Our Docker Compose setup automatically provisions all necessary services.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (included in Docker Desktop)

## Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/example/agent-api.git
   cd agent-api
   ```

2. **Configure environment variables**
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

## Configuration (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API Server port | `3000` |
| `API_KEY` | Optional Bearer token for authentication | _none_ |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `CHROME_URL` | Headless Chrome websocket URL | `ws://chrome:9222` |

## Verify Installation

Once started, you can verify the health of the system by calling the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected output:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "services": {
    "redis": "connected",
    "chrome": "connected",
    "searxng": "available"
  }
}
```

## Troubleshooting

If you encounter issues:
- **Chrome fails to connect**: Ensure your machine has enough memory allocated to Docker (at least 4GB recommended).
- **Redis connection refused**: Wait a few seconds for the Redis container to finish initializing and try again.
- Check logs via `docker-compose logs -f`.
