# GameBook.Microservice.Game

[Leer este README en inglés](README.md)

`GameBook.Microservice.Game` será el servicio de favoritos de GameBook, un proyecto de portfolio para explorar videojuegos y administrar una colección personal.

## Responsabilidad

El servicio será propietario de la persistencia de juegos favoritos y de las operaciones autenticadas de favoritos de cada usuario. Está previsto con NestJS, Prisma y PostgreSQL, mediante una estructura orientada a DDD y una interfaz OpenAPI/Swagger. Verificará el JWT del usuario y mantendrá su esquema de base de datos independiente de AuthUser.

## Estado del repositorio

Este repositorio contiene la base inicial del proyecto. La implementación de la aplicación, la infraestructura y el despliegue están programados intencionadamente como tareas SDD posteriores.

## Configuración local de runtime

Game requiere `GAME_DATABASE_URL`, `JWT_PUBLIC_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE` y `AUTHUSER_URL` en un archivo `.env` privado e ignorado por Git. La clave pública debe corresponder a la clave privada local de AuthUser, y `JWT_ISSUER` y `JWT_AUDIENCE` deben usar los mismos valores en ambos servicios.

Cuando ambos servicios se ejecutan directamente en el host, usa:

```dotenv
AUTHUSER_URL=http://localhost:3001
PORT=3002
```

`AUTHUSER_URL` es la URL base de AuthUser sin el sufijo `/v1`. Cuando Game se ejecuta dentro de Docker Compose, `localhost` apunta al contenedor de Game; usa en su lugar el nombre del servicio AuthUser dentro de la red de Compose, por ejemplo `AUTHUSER_URL=http://authuser:3001` si el servicio se llama `authuser`.

Cada petición protegida conserva sin cambios la cabecera `Authorization: Bearer <token>` enviada por el frontend. Game verifica localmente la firma y los claims RS256 y después solicita a AuthUser la validación de la sesión y su estado de revocación. Las credenciales inválidas o revocadas devuelven `401`; si AuthUser no está disponible devuelve `503` y no se ejecuta el caso de uso de favoritos.

## Proyectos relacionados

- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
