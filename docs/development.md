# Development

## Requirements

- Node.js 24.
- pnpm 12.4.1, available through Corepack.
- PostgreSQL on the Neon `develop` branch for local development.
- AuthUser running locally when exercising protected requests.

## Install and run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Copy `.env.example` to `.env` and provide private local configuration. Do not commit `.env` or put credential values in documentation.

| Variable                   | Meaning                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GAME_DATABASE_URL`        | Runtime PostgreSQL connection for the Game schema, using the limited runtime role.                                  |
| `JWT_PUBLIC_KEY`           | AuthUser RS256 public key used to verify access tokens.                                                             |
| `JWT_ISSUER`               | Expected issuer claim for AuthUser tokens.                                                                          |
| `JWT_AUDIENCE`             | Expected audience claim for AuthUser tokens.                                                                        |
| `AUTHUSER_URL`             | AuthUser base URL without `/v1`; Game validates sessions through `GET /v1/auth/session`.                            |
| `CORS_ALLOWED_ORIGINS`     | Optional comma-separated list of exact browser origins.                                                             |
| `PORT`                     | Optional HTTP port; defaults to `3002`.                                                                             |
| `GAME_DATABASE_DIRECT_URL` | Direct database connection reserved for the migration workflow and limited migrator role. Never set it for runtime. |

Run the API in watch mode and execute the unit tests:

```bash
pnpm start:dev
pnpm test
```

The local API listens on `http://localhost:3002`; Swagger UI is at `/docs` and OpenAPI JSON at `/docs/openapi.json`. Favorite operations need an AuthUser JWT.

## Database and migrations

Use Neon `develop` for local development and integration checks. The Render production service uses the separate Neon `production` branch and its production runtime credentials.

Prisma migrations run only through [`.github/workflows/migrate-game.yml`](../.github/workflows/migrate-game.yml), using `GAME_DATABASE_DIRECT_URL` with the `gamebook_game_migrator_limited` role. The workflow deploys migrations on relevant pushes to `develop` and supports a manual run on `main` for production. It validates the role and schema before applying migrations, then verifies that a second deploy is idempotent. Do not run migrations from Render, Vercel or Docker Compose, and do not configure the migrator URL in those environments.

`GAME_DATABASE_URL` is the runtime connection and uses the limited application role. The migration URL and runtime URL are separate credentials.

## Release flow

Changes are reviewed into `develop`, then `develop` is promoted to `main`. The release-please workflow runs on `main` pushes or manual dispatch and opens or updates a release pull request from Conventional Commit history. Merging that release pull request creates the GitHub release and version tag. CI checks the merged release commit. Feature pull requests to `develop` use "Rebase and merge" so release-please lists each change once. Promotion (`develop → main`) and sync (`main → develop`) pull requests use a merge commit.

## Deployment and containers

The Render web service deploys from `main`. Swagger UI is exposed at `/docs`, and the OpenAPI document at `/docs/openapi.json`. Render's free tier may make its first request slow.

This repository contains a production `Dockerfile`; it does not contain a Compose file. The local multi-service Compose lives in [GameBook.System](https://github.com/CarlosSV923/GameBook.System), which connects Game to PostgreSQL and AuthUser on the local Docker network. Compose does not run migrations.

## Quality commands

| Command             | What it runs                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `pnpm format:check` | Checks formatting in `src/**/*.ts` and `tests/**/*.ts` with Prettier. |
| `pnpm lint`         | Runs Oxlint with type-aware checks on `src/` and `tests/`.            |
| `pnpm typecheck`    | Runs TypeScript without emitting files.                               |
| `pnpm test`         | Runs the Vitest unit suite once.                                      |
| `pnpm test:e2e`     | Runs the Vitest integration suite with `vitest.config.e2e.ts`.        |
| `pnpm test:cov`     | Runs Vitest with coverage collection.                                 |
| `pnpm db:validate`  | Validates the Prisma schema and configuration.                        |
| `pnpm build`        | Generates the Prisma client, then builds the NestJS application.      |

`pnpm format` writes formatting changes to TypeScript files. `pnpm start:dev` starts NestJS in watch mode; `pnpm start:prod` runs the compiled application.
