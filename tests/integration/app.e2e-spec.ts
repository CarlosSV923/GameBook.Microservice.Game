import { generateKeyPairSync } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';

const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.GAME_DATABASE_URL = 'postgresql://ep-develop.neon.tech/gamebook';
process.env.JWT_PUBLIC_KEY = publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();
process.env.JWT_ISSUER = 'gamebook-authuser-development';
process.env.JWT_AUDIENCE = 'gamebook-api-development';
process.env.AUTHUSER_URL = 'http://localhost:3001';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) returns a request id and does not enable CORS implicitly', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Origin', 'http://localhost:3000')
      .set('x-request-id', 'integration-request-01')
      .expect(200)
      .expect('Hello World!')
      .expect('x-request-id', 'integration-request-01')
      .expect((response) => {
        if (response.headers['access-control-allow-origin']) {
          throw new Error('CORS must remain disabled until GB-011.05');
        }
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
