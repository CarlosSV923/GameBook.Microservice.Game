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

Runtime database access uses `GAME_DATABASE_URL`. Prisma migrations use the separate `GAME_DATABASE_DIRECT_URL` only from controlled migration commands or Actions; migration credentials are not runtime credentials and are not part of Docker Compose.

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

Create a private, ignored `.env` file. The variable names are listed without values:

```dotenv
GAME_DATABASE_URL=
JWT_PUBLIC_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
AUTHUSER_URL=
CORS_ALLOWED_ORIGINS=
PORT=
```

`AUTHUSER_URL` is the AuthUser base URL without the `/v1` suffix. When both services run on the host, it points to the local AuthUser endpoint; inside Compose it resolves through the `authuser` service name. `JWT_PUBLIC_KEY`, `JWT_ISSUER`, and `JWT_AUDIENCE` must match AuthUser's corresponding signing configuration. PEM values may use literal `\n` escapes. Never commit environment files, keys, or database credentials.

Start the service:

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
