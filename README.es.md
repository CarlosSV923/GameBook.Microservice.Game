# GameBook.Microservice.Game

[English](README.md) · **Estado: activo — última versión v0.4.0**

[![CI](https://github.com/CarlosSV923/GameBook.Microservice.Game/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CarlosSV923/GameBook.Microservice.Game/actions/workflows/ci.yml)

[![Arquitectura de GameBook.Microservice.Game](architecture/GameBook.Microservice.Game-architecture-es.svg)](https://carlossv923.github.io/GameBook.Microservice.Game/GameBook.Microservice.Game-architecture-es.html)

GameBook.Microservice.Game almacena en PostgreSQL los juegos favoritos de cada usuario autenticado y expone la API que utiliza el frontend de GameBook.

## Qué hace

- Crea, lista, filtra, sugiere, actualiza y elimina los juegos favoritos de un usuario.
- Guarda una instantánea del nombre, fecha de lanzamiento, imagen, puntuación y plataformas de cada juego.
- Verifica los tokens RS256 de AuthUser y consulta el estado de la sesión a AuthUser.
- Mantiene los datos de Game en su propio esquema de PostgreSQL.

## Demo en vivo

Consulta la API con [Swagger UI](https://gamebook-microservice-game.onrender.com/docs) o lee el [JSON OpenAPI](https://gamebook-microservice-game.onrender.com/docs/openapi.json). En el plan gratuito de Render, la primera solicitud puede tardar. El [Frontend de GameBook](https://gamebook-frontend.vercel.app) es el cliente; las solicitudes de favoritos requieren un JWT de AuthUser.

## Desarrollo rápido

Se requieren Node.js 24 y pnpm 12.4.1.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Copia `.env.example` a `.env`, configura los valores locales y luego ejecuta y prueba:

```bash
pnpm start:dev
pnpm test
```

Consulta la [guía de desarrollo](docs/development.es.md) para conocer las variables de entorno, la base de datos, el despliegue y los comandos de calidad.

## Arquitectura

[![Diagrama de secuencia (SVG)](architecture/GameBook.Microservice.Game-sequence-es.svg)](https://carlossv923.github.io/GameBook.Microservice.Game/GameBook.Microservice.Game-sequence-es.html)

El diagrama de arquitectura está al inicio de este README. La capa API gestiona HTTP, validación, autenticación JWT y OpenAPI. Los casos de uso de aplicación y las reglas de dominio operan mediante puertos; Prisma y el cliente de sesión de AuthUser están en la capa de infraestructura.

Explora todos los diagramas desde el [índice de GitHub Pages](https://carlossv923.github.io/GameBook.Microservice.Game/).

## Stack y decisiones

| Tecnología                                   | Motivo                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| NestJS y TypeScript                          | API HTTP con capas explícitas para API, aplicación, dominio e infraestructura.      |
| PostgreSQL y Prisma                          | Guardar favoritos en el esquema aislado `game` y consultarlos por usuario.          |
| JWT RS256 y validación de sesión de AuthUser | Verificar localmente las firmas de los tokens y respetar la revocación de sesiones. |
| Swagger y OpenAPI                            | Ofrecer una referencia interactiva de la API y un contrato legible por máquinas.    |
| pnpm, Vitest y Oxlint                        | Gestionar dependencias, ejecutar pruebas y revisar el código TypeScript.            |

## Proyectos relacionados

- [GameBook.System](https://github.com/CarlosSV923/GameBook.System) — documentación del sistema y Compose de integración local.
- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser) — cuentas, autenticación y validación de sesiones.
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend) — cliente web de las API de GameBook.

Licencia [MIT](LICENSE). © Carlos Sesme Vera.
