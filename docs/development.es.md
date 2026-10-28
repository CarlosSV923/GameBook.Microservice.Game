# Desarrollo

## Requisitos

- Node.js 24.
- pnpm 12.4.1, disponible mediante Corepack.
- PostgreSQL en la rama `develop` de Neon para el desarrollo local.
- AuthUser en ejecución local al probar solicitudes protegidas.

## Instalar y ejecutar

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Copia `.env.example` a `.env` y completa la configuración local privada. No confirmes `.env` ni incluyas valores de credenciales en la documentación.

| Variable                   | Significado                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `GAME_DATABASE_URL`        | Conexión PostgreSQL de runtime para el esquema Game, con el rol runtime limitado.                                                          |
| `JWT_PUBLIC_KEY`           | Clave pública RS256 de AuthUser para verificar tokens de acceso.                                                                           |
| `JWT_ISSUER`               | Claim de issuer esperado en los tokens de AuthUser.                                                                                        |
| `JWT_AUDIENCE`             | Claim de audience esperado en los tokens de AuthUser.                                                                                      |
| `AUTHUSER_URL`             | URL base de AuthUser sin `/v1`; Game valida las sesiones mediante `GET /v1/auth/session`.                                                  |
| `CORS_ALLOWED_ORIGINS`     | Lista opcional de orígenes exactos del navegador, separados por comas.                                                                     |
| `PORT`                     | Puerto HTTP opcional; el valor predeterminado es `3002`.                                                                                   |
| `GAME_DATABASE_DIRECT_URL` | Conexión directa a la base de datos reservada para el workflow de migraciones y el rol migrador limitado. Nunca se configura para runtime. |

Inicia la API en modo de observación y ejecuta las pruebas unitarias:

```bash
pnpm start:dev
pnpm test
```

La API local escucha en `http://localhost:3002`; Swagger UI está en `/docs` y el JSON OpenAPI en `/docs/openapi.json`. Las operaciones de favoritos requieren un JWT de AuthUser.

## Base de datos y migraciones

Usa Neon `develop` para desarrollo local y comprobaciones de integración. El servicio productivo de Render usa la rama independiente `production` de Neon y sus credenciales runtime de producción.

Las migraciones Prisma se ejecutan únicamente mediante [`.github/workflows/migrate-game.yml`](../.github/workflows/migrate-game.yml), con `GAME_DATABASE_DIRECT_URL` y el rol `gamebook_game_migrator_limited`. El workflow aplica migraciones ante cambios relevantes en `develop` y permite una ejecución manual en `main` para producción. Valida el rol y el esquema antes de aplicar las migraciones y comprueba que una segunda ejecución sea idempotente. No ejecutes migraciones desde Render, Vercel ni Docker Compose, y no configures la URL del migrador en esos entornos.

`GAME_DATABASE_URL` es la conexión runtime y utiliza el rol limitado de la aplicación. La URL de migración y la URL runtime son credenciales independientes.

## Flujo de release

Los cambios se revisan en `develop` y luego se promueve `develop` a `main`. El workflow release-please se ejecuta al recibir cambios en `main` o manualmente, y crea o actualiza un pull request de release a partir del historial de Conventional Commits. Al fusionar ese pull request de release, se crean la publicación de GitHub y la etiqueta de versión. CI comprueba el commit de release fusionado.

## Despliegue y contenedores

El servicio web de Render se despliega desde `main`. Swagger UI se publica en `/docs` y el documento OpenAPI en `/docs/openapi.json`. En el plan gratuito de Render, la primera solicitud puede tardar.

Este repositorio incluye un `Dockerfile` de producción; no incluye un archivo Compose. El Compose local con varios servicios está en [GameBook.System](https://github.com/CarlosSV923/GameBook.System) y conecta Game con PostgreSQL y AuthUser en la red local de Docker. Compose no ejecuta migraciones.

## Comandos de calidad

| Comando             | Qué ejecuta                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `pnpm format:check` | Comprueba con Prettier el formato de `src/**/*.ts` y `tests/**/*.ts`. |
| `pnpm lint`         | Ejecuta Oxlint con comprobaciones tipadas en `src/` y `tests/`.       |
| `pnpm typecheck`    | Ejecuta TypeScript sin generar archivos.                              |
| `pnpm test`         | Ejecuta una vez la suite unitaria de Vitest.                          |
| `pnpm test:e2e`     | Ejecuta la suite de integración de Vitest con `vitest.config.e2e.ts`. |
| `pnpm test:cov`     | Ejecuta Vitest y recopila cobertura.                                  |
| `pnpm db:validate`  | Valida el esquema y la configuración Prisma.                          |
| `pnpm build`        | Genera el cliente Prisma y luego compila la aplicación NestJS.        |

`pnpm format` aplica el formato a los archivos TypeScript. `pnpm start:dev` inicia NestJS en modo de observación; `pnpm start:prod` ejecuta la aplicación compilada.
