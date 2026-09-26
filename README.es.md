# GameBook.Microservice.Game

[Leer este README en inglés](README.md)

`GameBook.Microservice.Game` es el servicio de favoritos de GameBook. Almacena los juegos favoritos de cada usuario autenticado y expone las operaciones que el frontend necesita para administrar esa colección.

## Responsabilidad

Game es propietario de la persistencia de favoritos, su creación y eliminación, el listado y filtrado, las sugerencias y la sincronización de instantáneas. Valida localmente el JWT RS256 emitido por AuthUser, comprueba mediante AuthUser el estado de la sesión y su revocación, y mantiene su esquema PostgreSQL independiente de AuthUser.

## Arquitectura implementada

- `src/api/` — controladores de favoritos, guard JWT, validación, CORS, IDs de solicitud, mapeo de excepciones y Swagger/OpenAPI.
- `src/application/` — casos de uso de favoritos, errores, puertos y tokens de dependencias.
- `src/domain/` — entidades de favoritos, reglas de plataformas, repositorios y errores de dominio.
- `src/infrastructure/` — persistencia Prisma, verificación JWT, cliente HTTP de AuthUser, configuración de runtime y adaptadores.
- `src/main.ts` — arranque de la aplicación, configuración HTTP y documentación.

El acceso runtime a la base de datos usa `GAME_DATABASE_URL`. Las migraciones Prisma usan `GAME_DATABASE_DIRECT_URL` por separado y únicamente desde comandos de migración controlados o Actions; las credenciales de migración no son credenciales runtime.

## Configuración local

Requisitos previos:

- Node.js 24 o una versión LTS compatible.
- pnpm 12.4.1 mediante Corepack.
- Un rol local de prueba para la base de datos, la clave pública de AuthUser y valores coincidentes de issuer/audience JWT.
- AuthUser ejecutándose localmente al probar peticiones protegidas.

Instala las dependencias y genera el cliente Prisma:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Copia `.env.example` a un archivo `.env` privado e ignorado por Git y completa solo los valores locales. La plantilla muestra los nombres de variables sin valores:

```dotenv
GAME_DATABASE_URL=
JWT_PUBLIC_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
AUTHUSER_URL=
CORS_ALLOWED_ORIGINS=
PORT=
```

La plantilla también muestra `GAME_DATABASE_DIRECT_URL` como variable exclusiva de migración. Proporciónala de forma privada solo al ejecutar comandos de migración Prisma; no es una credencial de runtime ni de despliegue. `AUTHUSER_URL` es la URL base de AuthUser sin el sufijo `/v1`. Cuando Game se ejecuta de forma individual, apunta al endpoint local de AuthUser. `JWT_PUBLIC_KEY`, `JWT_ISSUER` y `JWT_AUDIENCE` deben coincidir con la configuración de firma de AuthUser. Los valores PEM pueden usar escapes literales `\n`. Nunca confirmes archivos `.env`, claves ni credenciales de base de datos.

Inicia Game de forma individual:

```bash
pnpm start:dev
```

Game escucha por defecto en el puerto local 3002.

## Despliegue de producción

Game está desplegado en Render en [`https://gamebook-microservice-game.onrender.com`](https://gamebook-microservice-game.onrender.com). Swagger UI está disponible en [`/docs`](https://gamebook-microservice-game.onrender.com/docs) y el documento OpenAPI en [`/docs/openapi.json`](https://gamebook-microservice-game.onrender.com/docs/openapi.json). La dependencia productiva AuthUser es [`https://gamebook-microservice-authuser.onrender.com`](https://gamebook-microservice-authuser.onrender.com), y el origen del frontend es [`https://gamebook-frontend.vercel.app`](https://gamebook-frontend.vercel.app).

Configura estas variables runtime en Render sin confirmar sus valores:

```dotenv
GAME_DATABASE_URL=
JWT_PUBLIC_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
AUTHUSER_URL=
CORS_ALLOWED_ORIGINS=
```

`GAME_DATABASE_DIRECT_URL` es exclusiva de migraciones y permanece restringida a comandos Prisma controlados y GitHub Actions. No debe configurarse en Render. `AUTHUSER_URL` debe apuntar a la URL base del AuthUser desplegado sin el sufijo `/v1`.

## Endpoints y comportamiento locales

| Recurso | URL |
| --- | --- |
| AuthUser | `http://localhost:3001` |
| Servicio Game | `http://localhost:3002` |
| Swagger UI | `http://localhost:3002/docs` |
| JSON OpenAPI | `http://localhost:3002/docs/openapi.json` |
| Frontend | `http://localhost:3000` |

Swagger y OpenAPI son endpoints públicos de documentación. Las operaciones de favoritos requieren `Authorization: Bearer <token>`. Las credenciales inválidas o revocadas devuelven `401`; si AuthUser no está disponible se devuelve `503` sin ejecutar el caso de uso de favoritos.

## Pruebas y comprobaciones de calidad

```bash
pnpm test
pnpm test:e2e
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

## Política de release y despliegue

Los commits siguen Conventional Commits. El workflow `release-please` se ejecuta únicamente con pushes a `main` o mediante ejecución manual, usa los archivos manifest del repositorio y se autentica con los permisos mínimos de `GITHUB_TOKEN` necesarios para crear pull requests de release y releases de GitHub. El CI normal valida los pull requests y `main`; el commit del release se valida mediante CI después de fusionar el pull request de release.

El despliegue de producción se gestiona mediante Render. El repositorio no contiene configuración específica del proveedor.

## Proyectos relacionados

- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
