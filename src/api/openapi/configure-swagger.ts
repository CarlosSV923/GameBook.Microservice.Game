import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_UI_PATH = 'docs';
export const SWAGGER_JSON_PATH = 'docs/openapi.json';

export function configureSwagger(application: INestApplication): void {
  const port = application.get(ConfigService).get<string>('PORT') ?? '3002';
  const configuration = new DocumentBuilder()
    .setTitle('GameBook Game API')
    .setDescription(
      'Authenticated favorite-game operations isolated by the user UUID from the AuthUser JWT.',
    )
    .setVersion('0.1.0')
    .setOpenAPIVersion('3.0.3')
    .addServer(
      `http://localhost:${port}`,
      'Local development server for GameBook.Microservice.Game.',
    )
    .addTag('Favorites', 'Own favorites, filters and pagination.')
    .addTag(
      'Suggestions',
      'Suggestions derived from the authenticated user favorites.',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT issued by AuthUser. Never paste a real token here.',
      },
      'BearerAuth',
    )
    .build();

  const documentFactory = () => {
    const document = SwaggerModule.createDocument(application, configuration);

    for (const schema of Object.values(document.components?.schemas ?? {})) {
      if ('type' in schema && schema.type === 'object') {
        schema.additionalProperties = false;
      }
    }

    return document;
  };

  SwaggerModule.setup(SWAGGER_UI_PATH, application, documentFactory, {
    jsonDocumentUrl: SWAGGER_JSON_PATH,
  });
}
