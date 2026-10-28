# GameBook.Microservice.Game

[Español](README.es.md) · **Status: active — latest release v0.4.0**

[![CI](https://github.com/CarlosSV923/GameBook.Microservice.Game/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CarlosSV923/GameBook.Microservice.Game/actions/workflows/ci.yml)

[![GameBook.Microservice.Game architecture](architecture/GameBook.Microservice.Game-architecture-en.svg)](https://carlossv923.github.io/GameBook.Microservice.Game/GameBook.Microservice.Game-architecture-en.html)

GameBook.Microservice.Game stores each authenticated user's favorite games in PostgreSQL and exposes the API used by the GameBook frontend.

## What it does

- Creates, lists, filters, suggests, updates and deletes a user's favorite games.
- Stores a snapshot of each game's name, release date, image, rating and platforms.
- Verifies AuthUser RS256 tokens and checks session status with AuthUser.
- Keeps the Game data in its own PostgreSQL schema.

## Live demo

Explore the API with [Swagger UI](https://gamebook-microservice-game.onrender.com/docs) or read the [OpenAPI JSON](https://gamebook-microservice-game.onrender.com/docs/openapi.json). The Render free tier may make the first request slow. The [GameBook Frontend](https://gamebook-frontend.vercel.app) is the client; favorite requests require an AuthUser JWT.

## Quick development

Requires Node.js 24 and pnpm 12.4.1.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Copy `.env.example` to `.env`, configure local values, then run and test:

```bash
pnpm start:dev
pnpm test
```

See the [development guide](docs/development.md) for environment, database, deployment and quality details.

## Architecture

[![Sequence diagram (SVG)](architecture/GameBook.Microservice.Game-sequence-en.svg)](https://carlossv923.github.io/GameBook.Microservice.Game/GameBook.Microservice.Game-sequence-en.html)

The architecture diagram is at the top of this README. The API layer handles HTTP, validation, JWT authentication and OpenAPI. Application use cases and domain rules operate through ports, with Prisma and the AuthUser session client in the infrastructure layer.

Browse all diagrams from the [GitHub Pages index](https://carlossv923.github.io/GameBook.Microservice.Game/).

## Stack and decisions

| Technology                                | Why                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| NestJS and TypeScript                     | HTTP API with explicit API, application, domain and infrastructure layers. |
| PostgreSQL and Prisma                     | Persist favorites in the isolated `game` schema and query them by user.    |
| RS256 JWT and AuthUser session validation | Verify token signatures locally and honor session revocation.              |
| Swagger and OpenAPI                       | Provide an interactive API reference and machine-readable contract.        |
| pnpm, Vitest and Oxlint                   | Manage dependencies, run tests and check TypeScript code.                  |

## Related projects

- [GameBook.System](https://github.com/CarlosSV923/GameBook.System) — system documentation and local integration Compose.
- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser) — accounts, authentication and session validation.
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend) — browser client for the GameBook APIs.

Licensed under the [MIT License](LICENSE). © Carlos Sesme Vera.
