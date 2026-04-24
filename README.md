# LinkLift URL Shortener

I built this project as a more serious take on the classic URL shortener. I wanted something that still felt approachable as a portfolio piece, but also gave me room to show system design decisions I actually care about: caching, rate limiting, analytics, deployment, and production debugging.

Live site: [https://3.219.205.122/](https://3.219.205.122/)

## Why I Built It

A lot of URL shortener projects stop at “store a URL and redirect it.” I wanted this one to go further.

My goals were:

- build a backend with a clear separation between routing, services, repositories, and infrastructure
- use Redis for a real performance optimization instead of including it just to list it on the stack
- keep PostgreSQL as the source of truth for URLs and click history
- add analytics and rate limiting so the project feels more like a real product
- deploy it myself to AWS and deal with the operational issues that come with that

## Live Demo

- App: [https://3.219.205.122/](https://3.219.205.122/)
- Health check: [https://3.219.205.122/health](https://3.219.205.122/health)

## What It Does

- Shortens long URLs through `POST /shorten`
- Redirects short codes through `GET /:code`
- Uses Redis with a cache-aside pattern for hot URL lookups
- Tracks click metadata in PostgreSQL
- Exposes analytics through `GET /analytics/:code`
- Rate limits requests per IP using Redis
- Serves the React frontend from the Express server in production

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Cache / rate limiting | Redis |
| Frontend | React, Vite, Tailwind CSS |
| Testing | Jest, Supertest |
| Load testing | autocannon |
| Local infrastructure | Docker Compose |
| Deployment | AWS EC2, Nginx, Let's Encrypt, pm2 |

## Architecture

At a high level, the request flow looks like this:

```text
Client
  -> Express API
    -> Redis rate limiter
    -> POST /shorten -> PostgreSQL
    -> GET /:code -> Redis cache -> PostgreSQL fallback
    -> async analytics write -> clicks table
    -> GET /analytics/:code -> PostgreSQL aggregation
```

## Design Decisions

### Redis cache-aside

For redirects, I check Redis first. If the short code is already cached, the backend can redirect immediately. If it is not cached, I read from PostgreSQL, return the result, and write it back to Redis with a 24 hour TTL.

I picked this because it keeps PostgreSQL as the source of truth while still making the hot redirect path fast.

### PostgreSQL over MongoDB

This data model is pretty relational:

- one canonical `urls` table
- one append-only `clicks` table
- a clear lookup key in `short_code`
- straightforward analytics queries like total clicks and recent clicks

PostgreSQL felt like the better fit because I wanted constraints, indexes, and simple SQL aggregations.

### Redis-backed rate limiting

Each IP gets a Redis key in the form `ratelimit:{ip}`. I increment the key on each request, set a 60 second expiration on first touch, and return `429` once the count goes over 10.

I like this approach because it is simple, fast, and easy to scale if the app ever moves beyond a single server.

### Async analytics writes

On redirect, I log analytics asynchronously instead of blocking the redirect on a database write. That keeps the user-facing path fast while still capturing useful metadata.

## Database Schema

### `urls`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| short_code | varchar | unique |
| original_url | text | original destination |
| created_at | timestamp | creation timestamp |

### `clicks`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| short_code | varchar | references the shortened URL |
| clicked_at | timestamp | click timestamp |
| user_agent | text | browser/client info |
| ip | varchar | client IP |

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

1. Start Redis and PostgreSQL:

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

6. Run the load test:

```bash
npm run loadtest
```

## Environment Variables

The local `.env` is set up so the project runs immediately on this machine:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/url_shortener
REDIS_URL=redis://localhost:6379
PORT=8080
BASE_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:5173
```

Note: PostgreSQL is mapped to `5433` locally because `5432` was already in use on my machine during setup.

## Testing

I wrote Jest tests for:

- URL validation
- short-code generation
- cache-aside lookup behavior
- rate limiting
- analytics route behavior

Current test result:

- `5` test suites passed
- `9` tests passed

## Load Test Results

I used `autocannon` against the redirect endpoint with:

- `100` concurrent connections
- `30` second duration

Measured result:

| Metric | Result |
| --- | --- |
| Average requests/sec | `5998.77` |
| p99 latency | `50 ms` |
| Error rate | `0.00%` |
| 3xx responses | `179931` |
| 4xx responses | `0` |
| 5xx responses | `0` |

Raw output is in [results/loadtest.txt](/Users/kobeguo/Desktop/projects/url-shortener/results/loadtest.txt).

## Deployment

I deployed this on an Amazon Linux 2023 EC2 instance in `us-east-1`.

Production setup:

- Nginx terminating HTTPS on `443` and redirecting `80` to `443`
- Express backend managed with `pm2`
- Redis and PostgreSQL running through Docker Compose on the EC2 host
- React frontend built with Vite and served from the backend
- Let's Encrypt short-lived IP certificate with automated renewal

Deployment-related files:

- [ecosystem.config.cjs](/Users/kobeguo/Desktop/projects/url-shortener/ecosystem.config.cjs)
- [scripts/bootstrap-ec2.sh](/Users/kobeguo/Desktop/projects/url-shortener/scripts/bootstrap-ec2.sh)
- [scripts/deploy-ec2.sh](/Users/kobeguo/Desktop/projects/url-shortener/scripts/deploy-ec2.sh)

One thing I actually liked about this project is that deployment was not completely smooth, which made it more realistic:

- I had to fix Docker Compose installation on Amazon Linux 2023
- I had to debug a blank page issue caused by CSP upgrading HTTP asset requests to HTTPS on port `8080`
- I had to add an HTTP-safe clipboard fallback because `navigator.clipboard` is restricted on non-secure origins
- I ended up finishing the deployment with Nginx in front of the app, a real HTTPS certificate for the Elastic IP, and automated certificate renewal

That debugging work ended up being one of the most valuable parts of the project.

## A Few Things I’d Improve Next

If I kept iterating on this, I’d probably add:

- a custom domain
- an ALB or CloudFront in front of the instance
- user accounts or ownership for short links
- expiration policies for links
- more detailed analytics
- CI/CD for automated deployment

## Repo

GitHub: [https://github.com/KobeGuo99/url-shortener](https://github.com/KobeGuo99/url-shortener)
