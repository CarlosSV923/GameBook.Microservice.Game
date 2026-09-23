# GameBook.Microservice.Game

[Leer este README en inglés](README.md)

`GameBook.Microservice.Game` será el servicio de favoritos de GameBook, un proyecto de portfolio para explorar videojuegos y administrar una colección personal.

## Responsabilidad

El servicio será propietario de la persistencia de juegos favoritos y de las operaciones autenticadas de favoritos de cada usuario. Está previsto con NestJS, Prisma y PostgreSQL, mediante una estructura orientada a DDD y una interfaz OpenAPI/Swagger. Verificará el JWT del usuario y mantendrá su esquema de base de datos independiente de AuthUser.

## Estado del repositorio

Este repositorio contiene la base inicial del proyecto. La implementación de la aplicación, la infraestructura y el despliegue están programados intencionadamente como tareas SDD posteriores.

## Proyectos relacionados

- [GameBook.Microservice.AuthUser](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
