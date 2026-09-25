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

El acceso runtime a la base de datos usa `GAME_DATABASE_URL`. Las migraciones Prisma usan `GAME_DATABASE_DIRECT_URL` por separado y únicamente desde comandos de migración controlados o Actions; las credenciales de migración no son credenciales runtime ni forman parte de Docker Compose.

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

Crea un archivo `.env` privado e ignorado por Git. Los nombres de variables se muestran sin valores:

```dotenv
GAME_DATABASE_URL=
JWT_PUBLIC_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
AUTHUSER_URL=
CORS_ALLOWED_ORIGINS=
PORT=
```

`AUTHUSER_URL` es la URL base de AuthUser sin el sufijo `/v1`. Cuando ambos servicios se ejecutan en el host, apunta al endpoint local de AuthUser; dentro de Compose se resuelve mediante el nombre de servicio `authuser`. `JWT_PUBLIC_KEY`, `JWT_ISSUER` y `JWT_AUDIENCE` deben coincidir con la configuración de firma de AuthUser. Los valores PEM pueden usar escapes literales `\n`. Nunca confirmes archivos de entorno, claves ni credenciales de base de datos.

Inicia el servicio:

```bash
pnpm start:dev
```

Game escucha por defecto en el puerto local 3002.

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

## Proyectos relacionados

- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
