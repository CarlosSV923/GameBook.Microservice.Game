# GameBook.Microservice.Game

[Read this README in Spanish](README.es.md)

`GameBook.Microservice.Game` is the planned favorites service for GameBook, a portfolio project for exploring video games and managing a personal collection.

## Responsibility

The service will own favorite-game persistence and the authenticated favorite operations for each user. It is planned with NestJS, Prisma, and PostgreSQL, using a DDD-oriented structure and an OpenAPI/Swagger interface. It will verify the user JWT and keep its database schema independent from AuthUser.

## Repository status

This repository contains the initial project foundation. Application implementation, infrastructure, and deployment are intentionally scheduled as later SDD tasks.

## Related projects

- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
