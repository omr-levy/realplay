# RealPlay Tournaments Service

A small NestJS/Fastify service that creates tournaments, ingests bet events, exposes a
live leaderboard, and writes final results after a tournament ends.

## Prerequisites

- Node.js 18+
- Docker (for Postgres and Redis)

## Setup

```bash
npm install

# Start Postgres 16 + Redis 7
docker-compose up -d

# Apply the Prisma schema
npx prisma migrate dev

# Run the service
npm run start:dev
```

The service listens on `http://localhost:3000` by default (see `.env` for `DATABASE_URL`,
`REDIS_HOST`, `REDIS_PORT`).

> If you already run a Postgres or Redis instance locally on the default ports (5432 /
> 6379), either stop it or remap the ports in `docker-compose.yml` and `.env` — a
> pre-existing local service silently intercepting connections meant for the Docker
> containers is an easy way to lose an afternoon.

## Endpoints

- `POST /tournaments` — create a tournament (`name`, `startsAt`, `endsAt`)
- `POST /bet` — ingest a bet event
- `GET /tournaments/:id/leaderboard?limit=&offset=` — paginated leaderboard, sorted by
  score DESC

## Data flow

See [dataflow.pdf](dataflow.pdf) for how tournament creation, bet ingestion, leaderboard
reads, and the BullMQ finalization job read and write Postgres and Redis.

## Tests

```bash
npm test
```

Covers bet ingestion, duplicate bet handling, and leaderboard ordering, with Prisma and
Redis mocked (no real DB/Redis needed).

## Assumptions and tradeoffs

- **Active-tournament matching is Redis-cached.** `POST /bet` never queries Postgres —
  it matches bets against a Redis-cached list of active tournaments, populated when each
  tournament is created. Postgres remains the source of truth for tournament state;
  Redis is just a fast cache for this hot path.
- **Single-currency system.** `currency` is validated on the bet payload but not used in
  scoring — the system assumes all amounts are in USD cents. A multi-currency version
  would need to convert to a common currency before adding the bet to the leaderboard.
- **No auth on `POST /bet`.** The endpoint assumes an internal/trusted caller (e.g. a
  bet-processing pipeline), not a public client.
- **Leaderboard source switches on tournament status.** While a tournament is `ACTIVE`
  (or `PENDING`), the leaderboard reads live from Redis. Once `FINALIZED`, it reads the
  persisted `TournamentResult` rows from Postgres instead.
- **Rank is the sorted array position**, computed at read time. Ties are broken by
  whichever order Redis returns equal scores in — no secondary sort key (e.g. bet
  recency) is applied.
- **Finalization grace period.** The background job that snapshots final results runs at
  `endsAt + FINALIZE_GRACE_MS` (default 5s, configurable via `.env`) instead of exactly
  `endsAt`, so a bet that's in-window but arrives at `POST /bet` slightly late still
  gets matched and scored before results are locked in.
- **Individual bets are not persisted.** Only the aggregate effect of a bet (the leaderboard
  increment) and its `externalBetId` (for dedup) are kept — there's no audit trail of
  amounts/players/timestamps per bet. At scale, the natural fix is to append each accepted
  bet to a Redis list/stream alongside the existing `ZINCRBY`, then bulk-insert it into a
  `Bet` table from the snapshot job's existing transaction (reusing that job rather than
  scheduling a separate upload) — or, for high-volume/long-running tournaments, drain that
  stream continuously via a separate workers instead of only at finalization.

## Known limitations

- **Late bets beyond the grace period.** A bet arriving later than
  `endsAt + FINALIZE_GRACE_MS` is silently dropped — the tournament is no longer in
  Redis's active set, so it simply won't match. The caller still gets
  `{"status": "accepted"}`, since the bet may have matched other active tournaments. A
  fully robust fix would need a reconciliation pass against Postgres.
