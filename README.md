# GameBook.Microservice.Game

[Read this README in Spanish](README.es.md)

`GameBook.Microservice.Game` is the planned favorites service for GameBook, a portfolio project for exploring video games and managing a personal collection.

## Responsibility

The service will own favorite-game persistence and the authenticated favorite operations for each user. It is planned with NestJS, Prisma, and PostgreSQL, using a DDD-oriented structure and an OpenAPI/Swagger interface. It will verify the user JWT and keep its database schema independent from AuthUser.

## Repository status

This repository contains the initial project foundation. Application implementation, infrastructure, and deployment are intentionally scheduled as later SDD tasks.

## Local runtime configuration

Game requires `GAME_DATABASE_URL`, `JWT_PUBLIC_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE`, and `AUTHUSER_URL` in its private, ignored `.env` file. The public key must match AuthUser's local private key, and `JWT_ISSUER` and `JWT_AUDIENCE` must use the same values as AuthUser.

When both services run directly on the host, use:

```dotenv
AUTHUSER_URL=http://localhost:3001
PORT=3002
```

`AUTHUSER_URL` is the AuthUser base URL without the `/v1` suffix. When Game runs inside Docker Compose, `localhost` points to the Game container; use the AuthUser service name on the Compose network instead, for example `AUTHUSER_URL=http://authuser:3001` when that service is named `authuser`.

## Local service and API documentation

When the service runs directly on the host, Game listens on port `3002` by default. The local URLs used by the frontend are:

| Service | Local URL |
| --- | --- |
| AuthUser | `http://localhost:3001` |
| Game API | `http://localhost:3002` |
| Game Swagger UI | `http://localhost:3002/docs` |
| Game OpenAPI JSON | `http://localhost:3002/docs/openapi.json` |
| Frontend | `http://localhost:3000` |

The Swagger UI and OpenAPI document are public documentation endpoints. The five Game favorite operations remain protected by the `Authorization: Bearer <token>` header described in the contract.

Every protected request keeps the frontend's `Authorization: Bearer <token>` header unchanged. Game verifies the RS256 signature and claims locally, then asks AuthUser to validate the session and revocation state. Invalid or revoked credentials return `401`; an unavailable AuthUser dependency returns `503` and the favorite use case is not executed.

## Related projects

- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
