# LinkLift URL Shortener

LinkLift is a production-style URL shortener built to showcase backend fundamentals that come up in high-signal software engineering interviews: caching strategy, persistence modeling, rate limiting, analytics capture, deployment readiness, and end-to-end operational verification.

The project was built with an Express API, Redis cache-aside reads, PostgreSQL persistence, a React + Vite frontend, Docker Compose for local infrastructure, Jest unit tests, and `autocannon` load testing. The backend serves the production frontend build so the deployed shape can stay simple on a single EC2 host.

## Motivation

Most portfolio URL shorteners stop at a CRUD demo. This one is intentionally engineered as a systems-flavored project:

- fast redirect path backed by Redis
- durable source of truth in PostgreSQL
- analytics trail for product instrumentation
- Redis-backed per-IP rate limiting
- Dockerized local infrastructure
- production build served by the backend

## Architecture

### Request flow

```text
Browser / API client
        |
        v
Express server (helmet, CORS, logging)
        |
        +--> Redis rate limiter
        |       key: ratelimit:{ip}
        |       ttl: 60 seconds
        |
        +--> POST /shorten
        |       validate URL
        |       generate unique short code
        |       write to PostgreSQL urls table
        |       warm Redis cache
        |
        +--> GET /:code
        |       read-through cache-aside lookup in Redis
        |       fallback to PostgreSQL on miss
        |       cache result for 24 hours
        |       redirect client
        |       async insert into PostgreSQL clicks table
        |
        +--> GET /analytics/:code
                query PostgreSQL for aggregate count + recent click rows
```

### Design notes

`Cache-aside pattern`
The redirect path checks Redis first for `url:{shortCode}`. On a cache miss, the backend reads PostgreSQL, returns the redirect target, and writes the result back into Redis with a 24 hour TTL. This keeps hot links fast without making Redis the source of truth.

`Why PostgreSQL over MongoDB`
The core entities here are relational and query-friendly: a canonical `urls` table and an append-only `clicks` table keyed by `short_code`. PostgreSQL gives strong constraints, straightforward indexing, and simple aggregation for analytics queries without introducing document-shape flexibility that the workload does not need.

`Redis TTL tradeoff`
A 24 hour TTL keeps frequently requested URLs hot while allowing cache contents to age out automatically. A shorter TTL would reduce memory pressure but increase miss traffic; a longer TTL would improve hit rate at the cost of more stale occupancy in Redis.

`Rate limiting design`
Every limited request increments `ratelimit:{ip}` in Redis. The first request sets a 60 second expiry, and once the counter exceeds 10 the API returns `429` with a clear error message. This keeps the limiter centralized, fast, and horizontally friendly if the API is later scaled beyond one instance.

## Schema

`urls`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| short_code | varchar | unique |
| original_url | text | destination URL |
| created_at | timestamp | creation timestamp |

`clicks`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| short_code | varchar | foreign key to `urls.short_code` |
| clicked_at | timestamp | click timestamp |
| user_agent | text | client metadata |
| ip | varchar | client IP |

## Real Verification Results

### Local environment

- Node.js: `v25.9.0`
- npm: `11.12.1`
- Docker: `29.3.0`
- Docker Compose: `v5.1.0`
- AWS CLI: user-scoped install repaired locally as `aws-cli/1.44.84`

### Local service verification

- Docker Compose started successfully with healthy PostgreSQL and Redis containers.
- PostgreSQL was mapped to `localhost:5433` because `5432` was already occupied on this machine during setup.
- `POST /shorten` created live short codes including `H6SsviB` and `sFanY96`.
- `GET /:code` returned `302` redirects and hydrated Redis cache entries such as `url:H6SsviB`.
- Rate limiting returned `429` on the 11th request within the 60 second window for the same client IP.
- `GET /analytics/H6SsviB` returned live click totals and the last 10 click records with IP and user-agent metadata.
- Jest suite passed: `5` test suites, `9` tests.
- Vite dev server successfully proxied API requests through `http://localhost:5173`.

### Load test

Benchmark command shape:

```bash
npm run loadtest
```

Measured on April 23, 2026 against `GET /H6SsviB` with `100` concurrent connections for `30` seconds:

| Metric | Result |
| --- | --- |
| Average requests/sec | `5998.77` |
| p99 latency | `50 ms` |
| Error rate | `0.00%` |
| 3xx responses | `179931` |
| 4xx responses | `0` |
| 5xx responses | `0` |

Raw output is saved to [results/loadtest.txt](/Users/kobeguo/Desktop/projects/url-shortener/results/loadtest.txt).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend API | Node.js, Express |
| Cache / limiter | Redis |
| Persistent store | PostgreSQL |
| Frontend | React, Vite, Tailwind CSS |
| Testing | Jest, Supertest |
| Benchmarking | autocannon |
| Local infra | Docker, Docker Compose |
| Deployment target | AWS EC2 + pm2 |

## Project Structure

```text
backend/
  src/
    config/
    db/
    middleware/
    repositories/
    routes/
    services/
    tests/
    utils/
frontend/
docker/
results/
scripts/
docker-compose.yml
.env
README.md
```

## Local Setup

1. Start infrastructure:

```bash
docker compose up -d
```

2. Run the backend:

```bash
npm --prefix backend start
```

3. Run the frontend in development mode:

```bash
npm --prefix frontend run dev
```

4. Or build the frontend and serve everything from Express:

```bash
npm run build
npm start
```

5. Run tests:

```bash
npm test
```

6. Run the benchmark:

```bash
npm run loadtest
```

## Environment Variables

The root `.env` is prefilled for immediate local use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/url_shortener
REDIS_URL=redis://localhost:6379
PORT=8080
BASE_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:5173
```

## AWS Deployment Status

The app is deployed on Amazon Linux 2023 on a `t2.micro` EC2 instance in `us-east-1` and is running under `pm2`, with PostgreSQL and Redis managed by Docker Compose on the host.

- EC2 public DNS: `ec2-34-235-118-239.compute-1.amazonaws.com`
- Health check: `http://ec2-34-235-118-239.compute-1.amazonaws.com:8080/health`
- Live shorten endpoint: `http://ec2-34-235-118-239.compute-1.amazonaws.com:8080/shorten`
- Live demo short URL created during deployment verification: `http://ec2-34-235-118-239.compute-1.amazonaws.com:8080/ZeDPCTY`

Deployment assets used:

- [ecosystem.config.cjs](/Users/kobeguo/Desktop/projects/url-shortener/ecosystem.config.cjs)
- [scripts/bootstrap-ec2.sh](/Users/kobeguo/Desktop/projects/url-shortener/scripts/bootstrap-ec2.sh)
- [scripts/deploy-ec2.sh](/Users/kobeguo/Desktop/projects/url-shortener/scripts/deploy-ec2.sh)

`Live demo URL`
http://ec2-34-235-118-239.compute-1.amazonaws.com:8080/
