# GameBook.Microservice.Game

[Read this README in Spanish](README.es.md)

`GameBook.Microservice.Game` is the GameBook favorites service. It stores the authenticated user's favorite games and exposes the operations required by the frontend to manage that collection.

## Responsibility

Game owns favorite persistence, favorite creation and deletion, listing and filtering, suggestions, and snapshot synchronization. It validates the AuthUser-issued RS256 JWT locally, checks the session and revocation state through AuthUser, and keeps its PostgreSQL schema independent from AuthUser.

## Implemented architecture

- `src/api/` — favorite controllers, JWT guard, validation, CORS, request IDs, exception mapping, and Swagger/OpenAPI.
- `src/application/` — favorite use cases, errors, ports, and dependency tokens.
- `src/domain/` — favorite entities, platform rules, repositories, and domain errors.
- `src/infrastructure/` — Prisma persistence, JWT verification, AuthUser HTTP client, runtime configuration, and adapters.
- `src/main.ts` — application bootstrap, HTTP configuration, and documentation setup.

Runtime database access uses `GAME_DATABASE_URL`. Prisma migrations use the separate `GAME_DATABASE_DIRECT_URL` only from controlled migration commands or Actions; migration credentials are not runtime credentials.

## Local setup

Prerequisites:

- Node.js 24 or a compatible LTS version.
- pnpm 12.4.1 through Corepack.
- A local test database role, the AuthUser public key, and matching JWT issuer/audience values.
- AuthUser running locally when exercising protected requests.

Install dependencies and generate the Prisma client:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Copy `.env.example` to a private, ignored `.env` file and fill only the local values. The template lists the variable names without values:

```dotenv
GAME_DATABASE_URL=
JWT_PUBLIC_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
AUTHUSER_URL=
CORS_ALLOWED_ORIGINS=
PORT=
```

The template also lists `GAME_DATABASE_DIRECT_URL` as a migration-only variable. Provide it privately only when running Prisma migration commands; it is not a runtime or deployment credential. `AUTHUSER_URL` is the AuthUser base URL without the `/v1` suffix. When Game runs individually, it points to the local AuthUser endpoint. `JWT_PUBLIC_KEY`, `JWT_ISSUER`, and `JWT_AUDIENCE` must match AuthUser's corresponding signing configuration. PEM values may use literal `\n` escapes. Never commit `.env` files, keys, or database credentials.

Start Game individually:

```bash
pnpm start:dev
```

Game listens on local port 3002 by default.

## Local endpoints and behavior

| Resource | URL |
| --- | --- |
| AuthUser | `http://localhost:3001` |
| Game service | `http://localhost:3002` |
| Swagger UI | `http://localhost:3002/docs` |
| OpenAPI JSON | `http://localhost:3002/docs/openapi.json` |
| Frontend | `http://localhost:3000` |

Swagger and OpenAPI are public documentation endpoints. Favorite operations require `Authorization: Bearer <token>`. Invalid or revoked credentials return `401`; an unavailable AuthUser dependency returns `503` without executing the favorite use case.

## Tests and quality checks

```bash
pnpm test
pnpm test:e2e
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

## Related projects

- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
